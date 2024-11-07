import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoyaltyService } from "./services/loyalty.service";
import { LoyaltyController } from "./controllers/loyalty.controller";
import { Loyalty } from "./entities/loyalty.entity";
import { HealthController } from "controllers/health.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Loyalty])],
  providers: [LoyaltyService],
  controllers: [LoyaltyController, HealthController],
})
export class LoyaltyModule {}
