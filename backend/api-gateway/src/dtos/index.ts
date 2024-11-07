import { IsEnum, IsISO8601, IsNumber, IsString, IsUUID } from "class-validator";

export enum Status {
  PAID = 'PAID',
  REVERSED = 'REVERSED',
  CANCELED = 'CANCELED',
}

export class CreateReservationRequest {
  @IsUUID()
  hotelUid: number;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;
}

export type GetHotelsDto = {
  page: number;
  size: number;
}
