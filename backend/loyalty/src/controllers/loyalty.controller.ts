import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Headers, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Query, Res } from "@nestjs/common";
import { LoyaltyService } from "../services/loyalty.service";
import { ChangeReservationCountDto, ChangeReservationStrategy, CreateLoyaltyDto } from "dtos";

@Controller('loyalty')
export class LoyaltyController {
  public constructor(private service: LoyaltyService) {}

  @Get(':username')
  async getUserLoyalty(
    @Param('username')
    username?: string
  ) {
    if (!username)
      throw new BadRequestException('Не указан username'); 
    return await this.service.getLoyaltyByUsername(username);
  }

  @Put('reservation_count')
  async changeReservationCount(
    @Body()
    dto: ChangeReservationCountDto,
  ): Promise<void> {
    if (dto.strategy === ChangeReservationStrategy.INCREMENT)
      await this.service.onUserReserved(dto.username);
    else 
      await this.service.onUserCanceledReservation(dto.username);
  }

  @Post()
  async create(
    @Body()
    dto: CreateLoyaltyDto) {
    return await this.service.createLoyalty(dto);
  }
}
