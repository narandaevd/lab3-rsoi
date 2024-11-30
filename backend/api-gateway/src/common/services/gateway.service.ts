import { DefaultValuePipe, Get, Inject, Injectable, NotFoundException, ParseIntPipe, Query } from "@nestjs/common";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { CreateReservationRequest } from "dtos";
import { Channel, Connection } from "amqplib";
import { CircuitBreaker } from "./circuit-breaker";

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
    reservationServices: {
      service: AxiosInstance;
      pinger: () => Promise<void>;
    },
    @Inject('LOYALTY_ADAPTER')
    loyaltyServices: {
      service: AxiosInstance;
      pinger: () => Promise<void>;
    },
    @Inject('PAYMENT_ADAPTER')
    paymentServices: {
      service: AxiosInstance;
      pinger: () => Promise<void>;
    },
    @Inject('RMQ_SERVICE')
    private readonly rmqConnection: Connection,
  ) {
    this.reservationAdapter = reservationServices.service;
    this.loyaltyAdapter = loyaltyServices.service;
    this.paymentAdapter = paymentServices.service;
    this.reservationCB = new CircuitBreaker({
      maxAttempts: MAX_ATTEMPTS, 
      pingCallback: async () => {
        await reservationServices.pinger();
      },
      intervalInMs: 5 * 1000,
    });
    this.loyaltyCB = new CircuitBreaker({
      maxAttempts: MAX_ATTEMPTS, 
      pingCallback: async () => {
        await loyaltyServices.pinger();
      },
      intervalInMs: 1 * 1000,
    });
    this.paymentCB = new CircuitBreaker({
      maxAttempts: MAX_ATTEMPTS, 
      pingCallback: async () => {
        await paymentServices.pinger();
      },
      intervalInMs: 5 * 1000,
    });
  }

  private reservationAdapter: AxiosInstance;
  private loyaltyAdapter: AxiosInstance;
  private paymentAdapter: AxiosInstance;
  private retryChannel: Channel;
  private retryQueueName = 'retryQueueName';

  reservationCB: CircuitBreaker;
  loyaltyCB: CircuitBreaker;
  paymentCB: CircuitBreaker;

  async getHotels(params: {page: number; size: number}) {
    return await this.reservationCB.try(
      async () => await this.reservationAdapter.get('hotels', {params}),
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
    const loyalty = await this.loyaltyCB.try(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`)
    )
      .then(extractData)
      .catch(() => '');
    const reservations = await this.reservationCB.try(
      async () => await this.reservationAdapter.get('reservations', {
        headers: {
          'X-User-Name': username,
        }
      }),
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const payments = await this.paymentCB.try(
      async () => await this.paymentAdapter.get('payments', {
        params: {
          uids: JSON.stringify(reservations.map(r => r.paymentUid)),
        }
      }),
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
    const reservations = await this.reservationCB.try(
      async () => await this.reservationAdapter.get(`reservations`, {
        headers: {'X-User-Name': username},
      }),
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const payments = await this.paymentCB.try(
      async () => await this.paymentAdapter.get('payments', {
        params: {
          uids: JSON.stringify(reservations.map(r => r.paymentUid)),
        }
      }),
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
    const hotel = await this.reservationCB.try(
      async () => await this.reservationAdapter.get(`hotels/${dto.hotelUid}`),
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    const loyalty = await this.reservationCB.try(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`), 
    )
      .then(extractData)
      .catch(markedLoyaltyServiceErrorReaction);
    const rawPrice = this.getNumberOfNights(new Date(dto.startDate), new Date(dto.endDate)) * hotel.price;
    const priceWithDiscount = rawPrice - (rawPrice * loyalty.discount / 100.0);
    const payment = await this.paymentCB.try(
      async () => await this.paymentAdapter.post('payments', {
        price: priceWithDiscount,
        status: "PAID",
      }),
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
    await this.loyaltyCB.try(
      async () => await this.loyaltyAdapter.put(`loyalty/reservation_count`, {strategy: 'INCREMENT', username}), 
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
    const reservationToCancel = await this.getUserReservationByUid(uid, username)
      .catch(markedReservationServiceErrorReaction);
    if (reservationToCancel.status === 'CANCELED')
      throw new NotFoundException('Уже отменена бронь');
    await this.reservationAdapter.delete(`reservations/${uid}`, {
      headers: {
        'X-User-Name': username,
      }
    });
    await this.paymentCB.try(
      async () => await this.paymentAdapter.delete(`payments/${reservationToCancel.paymentUid}`),
    )
      .catch(markedPaymentServiceErrorReaction);
    const changeReservationCountParams = {strategy: 'DECREMENT', username};
    await this.loyaltyCB.try(
      async () => await this.loyaltyAdapter.put(`loyalty/reservation_count`, changeReservationCountParams),
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
    const reservation = await this.reservationCB.try(
      async () => await this.reservationAdapter.get(`reservations/${reservationUid}`, {
        headers: {'X-User-Name': username},
      }),
    )
      .then(extractData)
      .catch(markedReservationServiceErrorReaction);
    reservation.hotel.fullAddress = buildFullAddress(reservation.hotel);
    reservation.hotel.address = undefined;
    const payment = await this.paymentCB.try(
      async () => await this.paymentAdapter.get(`payments/${reservation.paymentUid}`),
    )
      .then(extractData)
      .catch(() => '');
    reservation.payment = payment;
    return reservation;
  }

  async getLoyalty(username: string) {
    return await this.loyaltyCB.try(
      async () => await this.loyaltyAdapter.get(`loyalty/${username}`), 
    )
      .then(extractData)
      .catch(markedLoyaltyServiceErrorReaction);
  }

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
      } finally {
        this.retryChannel.ack(msg);
      }
    });
  }
}

function buildFullAddress(hotel) {
  return [
    hotel.country,
    hotel.city,
    hotel.address,
  ].join(', ');
}