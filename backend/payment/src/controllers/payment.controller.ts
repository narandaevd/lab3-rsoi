import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, Headers, HttpCode, HttpStatus, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res } from "@nestjs/common";
import { PaymentService } from "../services/payment.service";
import { CreatePaymentDto } from "dtos";
import { Payment } from "entities/payment.entity";

@Controller('payments')
export class PaymentController {
  public constructor(private service: PaymentService) {}

  @Get(':uid')
  async getByUid(
    @Param('uid', new ParseUUIDPipe({version: '4'}))
    uid: string,
  ) {
    return await this.service.getByUid(uid);
  }

  @Get()
  async getMultipleByUid(
    @Query('uids')
    uids?: string
  ) {
    if (!uids) {
      throw new BadRequestException('Не переданы uids');
    }
    return await this.service.getMultipleByUid(JSON.parse(uids));
  }

  @Post()
  async createPayment(@Body() dto: CreatePaymentDto): Promise<Payment> {
    return await this.service.createPayment(dto);
  }

  @Delete(':uid')
  async cancelPayment(
    @Param('uid', new ParseUUIDPipe({version: '4'}))
    uid: string,
  ) {
    await this.service.cancelPayment(uid);
  }
}
