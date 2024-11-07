import { IsEnum, IsNumber, IsString } from "class-validator";

export enum Status {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

export enum ChangeReservationStrategy {
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
}

export class CreateLoyaltyDto {
  @IsString()
  username: string;
}

export class ChangeReservationCountDto {
  @IsEnum(ChangeReservationStrategy)
  strategy: ChangeReservationStrategy;

  @IsString()
  username: string;
}
