import { Module } from "@nestjs/common";
import { PaymentModule } from "./payment.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "./entities/payment.entity";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

@Module({
  imports: [PaymentModule, TypeOrmModule.forRoot({
    entities: [Payment],
    synchronize: true,
    host: 'localhost',
    port: 5432,
    database: 'payments',
    username: 'program',
    password: 'test',
    type: 'postgres',
    namingStrategy: new SnakeNamingStrategy(),
  })]
})
export class MainHttpModule {}
