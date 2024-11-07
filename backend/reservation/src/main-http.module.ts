import { Module } from "@nestjs/common";
import { ReservationModule } from "./reservation.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Reservation } from "./entities/reservation.entity";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Hotel } from "./entities/hotels.entity";

@Module({
  imports: [ReservationModule, TypeOrmModule.forRoot({
    entities: [Reservation, Hotel],
    synchronize: true,
    host: 'localhost',
    port: 5432,
    database: 'reservations',
    username: 'program',
    password: 'test',
    type: 'postgres',
    namingStrategy: new SnakeNamingStrategy(),
  })]
})
export class MainHttpModule {}
