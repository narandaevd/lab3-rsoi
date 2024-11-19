import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Payment } from "../entities/payment.entity";
import { CreatePaymentDto, Status } from "dtos";

@Injectable()
export class PaymentService {
  public constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  async getByUid(uid: string) {
    const payment = await this.paymentRepo.findOneBy({
      paymentUid: uid,
    });
    if (!payment)
      throw new NotFoundException(`Нет payment с uid ${uid}`);
    return payment;
  }

  async getMultipleByUid(uids: string[]) {
    if (uids.length === 0) 
      return [];
    const payments = await this.paymentRepo.findBy({paymentUid: In(uids)});
    if (uids.length !== payments.length) {
      const uidsOfUnexistingPayments = uids.find(uid => !payments.some(payment => payment.paymentUid === uid));
      throw new NotFoundException(`Нет payment'ов с uid ${JSON.stringify(uidsOfUnexistingPayments)}`);
    }
    return payments;
  }

  async createPayment(dto: CreatePaymentDto) {
    return await this.paymentRepo.save(this.paymentRepo.create(dto));
  }

  async cancelPayment(uid: string) {
    await this.paymentRepo.update({
      paymentUid: uid,
    }, {
      status: Status.CANCELED,
    });
  }
}

