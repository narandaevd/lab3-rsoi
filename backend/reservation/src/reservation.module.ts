import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reservation } from "./entities/reservation.entity";
import { ReservationService } from "./services/reservation.service";
import { ReservationController } from "./controllers/reservation.controller";
import { Hotel } from "./entities/hotels.entity";
import { HealthController } from "controllers/health.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Hotel])],
  providers: [ReservationService],
  controllers: [ReservationController, HealthController],
})
export class ReservationModule {}
