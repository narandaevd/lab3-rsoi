import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Loyalty } from "../entities/loyalty.entity";
import { CreateLoyaltyDto, Status } from "dtos";

@Injectable()
export class LoyaltyService {
  public constructor(
    @InjectRepository(Loyalty)
    private repo: Repository<Loyalty>,
  ) {}

  async getLoyaltyByUsername(username: string): Promise<Loyalty> {
    const loyalty = await this.repo.findOne({
      where: {username}
    });
    if (!loyalty)
      throw new NotFoundException();
    return loyalty;
  }

  async createLoyalty(dto: CreateLoyaltyDto): Promise<Loyalty> {
    return await this.repo.save(this.repo.create({
      ...dto,
      discount: this.mapStatusToDiscount(Status.BRONZE),
    }));
  }

  mapStatusToDiscount(status: Status): number {
    const mapping = {
      [Status.BRONZE]: 5,
      [Status.SILVER]: 7,
      [Status.GOLD]: 10,
    }
    return mapping[status];
  }

  async onUserReserved(username: string): Promise<void> {
    const loyalty = await this.repo.findOneBy({username});
    const currentReservationCount = loyalty.reservationCount;
    const newReservationCount = currentReservationCount + 1;
    let maybeNewDiscount: number | undefined = undefined;
    let maybeNewStatus: Status | undefined = undefined;
    if (newReservationCount >= 10 && loyalty.status === Status.BRONZE) {
      maybeNewStatus = Status.SILVER;
      maybeNewDiscount = this.mapStatusToDiscount(maybeNewStatus);
    }
    if (newReservationCount >= 20 && loyalty.status === Status.SILVER) {
      maybeNewStatus = Status.GOLD;
      maybeNewDiscount = this.mapStatusToDiscount(maybeNewStatus);
    }
    if (maybeNewStatus) {
      loyalty.status = maybeNewStatus;
      loyalty.discount = maybeNewDiscount;
    }
    loyalty.reservationCount = newReservationCount;
    const savedLoyalty = await this.repo.save(loyalty);
    console.log('Юзер зарезервировал', JSON.stringify(savedLoyalty, null, 2));
  }

  async onUserCanceledReservation(username: string): Promise<void> {
    const loyalty = await this.repo.findOneBy({username});
    const currentReservationCount = loyalty.reservationCount;
    const newReservationCount = currentReservationCount - ((currentReservationCount - 1 < 0) ? 0 : 1);
    let maybeNewDiscount: number | undefined = undefined;
    let maybeNewStatus: Status | undefined = undefined;
    if (newReservationCount < 10 && loyalty.status === Status.SILVER) {
      maybeNewStatus = Status.BRONZE;
      maybeNewDiscount = this.mapStatusToDiscount(maybeNewStatus);
    }
    if (newReservationCount < 20 && loyalty.status === Status.GOLD) {
      maybeNewStatus = Status.SILVER;
      maybeNewDiscount = this.mapStatusToDiscount(maybeNewStatus);
    }
    if (maybeNewStatus) {
      loyalty.status = maybeNewStatus;
      loyalty.discount = maybeNewDiscount;
    }
    loyalty.reservationCount = newReservationCount;
    const savedLoyalty = await this.repo.save(loyalty);
    console.log('Юзер снял резерв', JSON.stringify(savedLoyalty, null, 2));
  }
}
