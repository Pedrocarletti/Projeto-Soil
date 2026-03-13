import { Body, Controller, Post } from '@nestjs/common';
import { TelemetryQueueService } from './telemetry-queue.service';
import { IngestTelemetryDto } from './dto/ingest-telemetry.dto';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryQueueService: TelemetryQueueService) {}

  @Post('ingest')
  async ingest(@Body() ingestTelemetryDto: IngestTelemetryDto) {
    await this.telemetryQueueService.enqueue({
      ...ingestTelemetryDto,
      source: ingestTelemetryDto.source ?? 'http-ingest',
    });

    return {
      queued: true,
    };
  }
}
