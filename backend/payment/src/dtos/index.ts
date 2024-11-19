import { IsEnum, IsISO8601, IsNumber, IsString, IsUUID } from "class-validator";

export enum Status {
  PAID = 'PAID',
  REVERSED = 'REVERSED',
  CANCELED = 'CANCELED',
}

export class CreatePaymentDto {
  @IsNumber()
  price: number;

  @IsEnum(Status)
  status: Status;
}
