import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryMqttService } from './telemetry-mqtt.service';
import { TelemetryProcessorService } from './telemetry-processor.service';
import { TelemetryQueueService } from './telemetry-queue.service';

@Module({
  imports: [RealtimeModule],
  controllers: [TelemetryController],
  providers: [
    TelemetryQueueService,
    TelemetryMqttService,
    TelemetryProcessorService,
  ],
  exports: [TelemetryQueueService, TelemetryMqttService],
})
export class TelemetryModule {}
