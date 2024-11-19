import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Headers, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res } from "@nestjs/common";
import {GatewayService} from '../common/services/gateway.service';
import { CreateReservationRequest } from "dtos";

@Controller()
export class GatewayController {
  public constructor(private service: GatewayService) {}

  @Get('hotels')
  async getHotels(
    @Query('page', new ParseIntPipe({optional: true}), new DefaultValuePipe(1))
    page: number,
    @Query('size', new ParseIntPipe({optional: true}), new DefaultValuePipe(10))
    size: number
  ) {
    return this.service.getHotels({page, size});
  }

  @Get('me')
  async getMe(
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.getMe(username);
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

  @HttpCode(HttpStatus.OK)
  @Post('reservations')
  async createReservation(
    @Body()
    dto: CreateReservationRequest,
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username');
    return await this.service.createReservation(username, dto); 
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
    return await this.service.cancelReservation(username, reservationUid);
  }

  @Get(':username')
  async getUserLoyalty(
    @Headers('X-User-Name')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.getLoyalty(username);
  }
}
