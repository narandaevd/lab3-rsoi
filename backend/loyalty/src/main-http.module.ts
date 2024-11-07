import { Module } from "@nestjs/common";
import { LoyaltyModule } from "./loyalty.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Loyalty } from "entities/loyalty.entity";

@Module({
  imports: [LoyaltyModule, TypeOrmModule.forRoot({
    entities: [Loyalty],
    synchronize: true,
    host: 'localhost',
    port: 5432,
    database: 'loyalties',
    username: 'program',
    password: 'test',
    type: 'postgres',
    namingStrategy: new SnakeNamingStrategy(),
  })]
})
export class MainHttpModule {}
