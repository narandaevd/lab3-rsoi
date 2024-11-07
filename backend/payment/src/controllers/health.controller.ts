import { Controller, Get, Version } from "@nestjs/common";

@Controller()
export class HealthController {
  
  @Version('manage/health')
  @Get()
  checkHealth() {
    return {isAlive: true};
  }
}
