import { DefaultValuePipe, Get, Inject, Injectable, NotFoundException, ParseIntPipe, Query } from "@nestjs/common";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { CreateReservationRequest } from "dtos";
import { retry } from "./retrier";
import { Channel, Connection } from "amqplib";

const extractData = (res: AxiosResponse) => res.data as any;

const MAX_ATTEMPTS = 5;

function markServiceUnavailableErrorReaction(service: string) {
  return (err: unknown) => {
    throw new Error(service + ' unavailable');
  };
}

const markedLoyaltyServiceErrorReaction = markServiceUnavailableErrorReaction('Loyalty Service');
const markedReservationServiceErrorReaction = markServiceUnavailableErrorReaction('Reservation Service');
const markedPaymentServiceErrorReaction = markServiceUnavailableErrorReaction('Payment Service');

@Injectable()
export class GatewayService {
  constructor(
    @Inject('RESERVATION_ADAPTER')
    private readonly reservationAdapter: AxiosInstance,
    @Inject('LOYALTY_ADAPTER')
    private readonly loyaltyAdapter: AxiosInstance,
    @Inject('PAYMENT_ADAPTER')
    private readonly paymentAdapter: AxiosInstance,
    @Inject('RMQ_SERVICE')
    private readonly rmqConnection: Connection,
  ) {}

  private retryChannel: Channel;
  private retryQueueName = 'retryQueueName';

  async onModuleInit(): Promise<void> {
    this.retryChannel = await this.rmqConnection.createChannel();
    await this.retryChannel.assertQueue(this.retryQueueName);
    this.retryChannel.consume(this.retryQueueName, async (msg) => {
      try {
        console.log("CONSUMED");
        const params = JSON.parse(msg.content.toString());
        await this.loyaltyAdapter.put(`loyalty/reservation_count`, params);
      } catch (err) {
        console.log("ERR ON CONSUME");
        setTimeout(() => this.retryChannel.sendToQueue(this.retryQueueName, msg.content), 10 * 1000);
      }
    });
  }

  async getHotels(params: {page: number; size: number}) {
    return await retry(
      async () => await this.reservationAdapter.get('hotels', {params}),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
  }

  private getNumberOfNights(startDate: Date, endDate: Date): number {
    const start = startDate;
    const end = endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Неверный формат даты");
    }
    const diffTime = (end as any) - (start as any);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.floor(diffDays));
  }

  async getMe(username: string) {
    const loyalty = await retry(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(() => '');
    const reservations = await retry(
      async () => await this.reservationAdapter.get('reservations', {
        headers: {
          'X-User-Name': username,
        }
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const payments = await retry(
      async () => await this.paymentAdapter.get('payments', {
        params: {
          uids: JSON.stringify(reservations.map(r => r.paymentUid)),
        }
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(() => []);
    const reservationsWithFullAddresses = reservations.map(res => ({
      ...res,
      hotel: {
        ...res.hotel,
        fullAddress: buildFullAddress(res.hotel)
      }
    }));
    return {
      reservations: this.mergeReservationsAndPayments(reservationsWithFullAddresses, payments),
      loyalty,
    };
  }

  mergeReservationsAndPayments(reservs, payments) {
    return reservs.map(reservation => {
      const payment = payments.find(payment => payment.paymentUid === reservation.paymentUid);
      return {
        ...reservation,
        payment: payment ?? null,
      };
    });
  }

  async getUserReservations(
    username: string
  ) {
    const reservations = await retry(
      async () => await this.reservationAdapter.get(`reservations`, {
        headers: {'X-User-Name': username},
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const payments = await retry(
      async () => await this.paymentAdapter.get('payments', {
        params: {
          uids: JSON.stringify(reservations.map(r => r.paymentUid)),
        }
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(() => []);
    return this.mergeReservationsAndPayments(reservations.map(res => ({
      ...res,
      hotel: {
        ...res.hotel,
        fullAddress: buildFullAddress(res.hotel)
      }
    })), payments);
  }

  async createReservation(username: string, dto: CreateReservationRequest) {
    const hotel = await retry(
      async () => await this.reservationAdapter.get(`hotels/${dto.hotelUid}`),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const loyalty = await retry(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`), 
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedLoyaltyServiceErrorReaction);
    const rawPrice = this.getNumberOfNights(new Date(dto.startDate), new Date(dto.endDate)) * hotel.price;
    const priceWithDiscount = rawPrice - (rawPrice * loyalty.discount / 100.0);
    const payment = await retry(
      async () => await this.paymentAdapter.post('payments', {
        price: priceWithDiscount,
        status: "PAID",
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedPaymentServiceErrorReaction);
    const createdReservation = await this.reservationAdapter.post('reservations', {
      paymentUid: (payment as any).paymentUid,
      username,
      status: 'PAID',
      ...dto,
    })
      .then(extractData)
      .catch(markedPaymentServiceErrorReaction)
    await retry(
      async () => await this.loyaltyAdapter.put(`loyalty/reservation_count`, {strategy: 'INCREMENT', username}), 
      MAX_ATTEMPTS
    )
      .catch(async err => {
        await this.paymentAdapter.delete(`payments/${payment.paymentUid}`),
        markedLoyaltyServiceErrorReaction(err);
      });
    createdReservation.payment = payment;
    createdReservation.hotelUid = hotel.hotelUid;
    createdReservation.discount = loyalty.discount;
    return createdReservation;
  }

  async cancelReservation(username: string, uid: string) {
    const reservationToCancel = await retry(
      async () => await await this.getUserReservationByUid(uid, username),
      MAX_ATTEMPTS,
    )
      .catch(markedReservationServiceErrorReaction);
    if (reservationToCancel.status === 'CANCELED')
      throw new NotFoundException('Уже отменена бронь');
    await this.reservationAdapter.delete(`reservations/${uid}`, {
      headers: {
        'X-User-Name': username,
      }
    });
    await retry(
      async () => await this.paymentAdapter.delete(`payments/${reservationToCancel.paymentUid}`),
      MAX_ATTEMPTS,
    )
      .catch(markedPaymentServiceErrorReaction);
    const changeReservationCountParams = {strategy: 'DECREMENT', username};
    await retry(
      async () => await this.loyaltyAdapter.put(`loyalty/reservation_count`, changeReservationCountParams),
      MAX_ATTEMPTS,
    )
      .catch(() => {
        console.log('SENDED TO QUEUE');
        this.retryChannel.sendToQueue(
          this.retryQueueName,
          Buffer.from(JSON.stringify(changeReservationCountParams))
        )
        return null;
      });
  }

  async getUserReservationByUid(
    reservationUid: string,
    username: string
  ) {
    const reservation = await retry(
      async () => await this.reservationAdapter.get(`reservations/${reservationUid}`, {
        headers: {'X-User-Name': username},
      }),
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    reservation.hotel.fullAddress = buildFullAddress(reservation.hotel);
    reservation.hotel.address = undefined;
    const payment = await retry(
      async () => await this.paymentAdapter.get(`payments/${reservation.paymentUid}`),
      MAX_ATTEMPTS,
    )
      .then(extractData)
      .catch(() => '');
    reservation.payment = payment;
    return reservation;
  }

  async getLoyalty(username: string) {
    return await retry(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`), 
      MAX_ATTEMPTS
    )
      .then(extractData)
      .catch(markedLoyaltyServiceErrorReaction);
  }
}

function buildFullAddress(hotel) {
  return [
    hotel.country,
    hotel.city,
    hotel.address,
  ].join(', ');
}