import { Module } from "@nestjs/common";
import { GatewayController } from "./controllers/gateway.controller";
import { GatewayService } from "common/services/gateway.service";
import { HealthController } from "controllers/health.controller";
import axios from "axios";
import {connect} from 'amqplib';

@Module({
  providers: [
    GatewayService,
    {
      provide: 'RESERVATION_ADAPTER',
      useValue: axios.create({baseURL: 'http://localhost:8070/api/v1'}),
    },
    {
      provide: 'LOYALTY_ADAPTER',
      useValue: axios.create({baseURL: 'http://localhost:8050/api/v1'}),
    },
    {
      provide: 'PAYMENT_ADAPTER',
      useValue: axios.create({baseURL: 'http://localhost:8060/api/v1'}),
    },
    {
      provide: "RMQ_SERVICE",
      async useFactory() {
        return await connect({
          hostname: 'localhost',
          port: 5672
        });
      }
    }
  ],
  controllers: [GatewayController, HealthController],
})
export class GatewayModule {}
