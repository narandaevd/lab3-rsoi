import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { PaymentService } from "./services/payment.service";
import { PaymentController } from "./controllers/payment.controller";
import { HealthController } from "controllers/health.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentService],
  controllers: [PaymentController, HealthController],
})
export class PaymentModule {}
