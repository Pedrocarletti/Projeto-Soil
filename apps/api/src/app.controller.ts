import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'soil-pivot-api',
      timestamp: new Date().toISOString(),
    };
  }
}
