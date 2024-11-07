import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export enum Status {
  PAID = 'PAID',
  REVERSED = 'REVERSED',
  CANCELED = 'CANCELED',
}

export class CreateReservationDto {
  @IsString()
  username: string;
  
  @IsUUID()
  paymentUid: string;
  
  @IsUUID()
  hotelUid: string;

  @IsEnum(Status)
  status: Status;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;
}

export type GetHotelsDto = {
  page: number;
  size: number;
}

export class CreateHotelDto {
  @IsString()
  name: string;
  @IsString()
  country: string;
  @IsString()
  city: string;
  @IsString()
  address: string;
  @IsNumber()
  @IsOptional()
  stars?: number;
  
  @IsNumber()
  price: number;
}
