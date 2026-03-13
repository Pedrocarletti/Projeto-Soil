import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { PivotsController } from './pivots.controller';
import { PivotsService } from './pivots.service';

@Module({
  imports: [TelemetryModule, RealtimeModule],
  controllers: [PivotsController],
  providers: [PivotsService],
  exports: [PivotsService],
})
export class PivotsModule {}
