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
      useFactory: () => {
        const service = axios.create({baseURL: 'http://localhost:8070/api/v1'});
        const pinger = axios.create({baseURL: 'http://localhost:8070/manage/health'});
        return {
          service,
          pinger: async () => await pinger.get('/'),
        };
      },
    },
    {
      provide: 'LOYALTY_ADAPTER',
      useFactory: () => {
        const service = axios.create({baseURL: 'http://localhost:8050/api/v1'});
        const pinger = axios.create({baseURL: 'http://localhost:8050/manage/health'});
        return {
          service,
          pinger: async () => await pinger.get('/'),
        };
      },
    },
    {
      provide: 'PAYMENT_ADAPTER',
      useFactory: () => {
        const service = axios.create({baseURL: 'http://localhost:8060/api/v1'});
        const pinger = axios.create({baseURL: 'http://localhost:8060/manage/health'});
        return {
          service,
          pinger: async () => await pinger.get('/'),
        };
      },
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
