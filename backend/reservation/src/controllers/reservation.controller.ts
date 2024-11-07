import { BadRequestException, Body, ClassSerializerInterceptor, Controller, DefaultValuePipe, Delete, Get, Headers, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res, UseInterceptors } from "@nestjs/common";
import { ReservationService } from "../services/reservation.service";
import { CreateHotelDto, CreateReservationDto } from "dtos";

@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class ReservationController {
  public constructor(private service: ReservationService) {}

  @Get('hotels')
  async getHotels(
    @Query('page', new ParseIntPipe({optional: true}), new DefaultValuePipe(1))
    page?: number,
    @Query('size', new ParseIntPipe({optional: true}), new DefaultValuePipe(10))
    size?: number
  ) {
    return this.service.getHotelPagination({page, size});
  }

  @Get('hotels/:hotelUid')
  async getHotelByUid(
    @Param('hotelUid', new ParseUUIDPipe({version: '4'}))
    uid: string,
  ) {
    return this.service.getHotelByUid(uid);
  }

  @Post('hotels')
  async createHotel(
    @Body()
    dto: CreateHotelDto
  ) {
    return this.service.createHotel(dto);
  }

  @Get('reservations')
  async getUserReservations(
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.getUserReservations(username);
  }

  @Get('reservations/:reservationUid')
  async getUserReservationByUid(
    @Param('reservationUid', new ParseUUIDPipe({version: '4'}))
    reservationUid: string,
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.getUserReservationByUid(reservationUid, username);
  }

  @Post('reservations')
  async createReservation(
    @Body()
    dto: CreateReservationDto,
  ) {
    return await this.service.createReservation(dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('reservations/:reservationUid')
  async deleteUserReservationByUid(
    @Param('reservationUid', new ParseUUIDPipe({version: '4'}))
    reservationUid: string,
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.deleteUserReservationByUid(reservationUid, username);
  }
}
