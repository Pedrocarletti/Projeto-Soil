import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { PivotTelemetryPacket } from '../common/interfaces/pivot-telemetry-packet.interface';
import { getRedisConnection } from '../common/utils/redis.util';

export const TELEMETRY_QUEUE_NAME = 'pivot-telemetry';

@Injectable()
export class TelemetryQueueService implements OnModuleDestroy {
  private readonly queue: Queue<PivotTelemetryPacket>;

  constructor(configService: ConfigService) {
    const redisUrl =
      configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.queue = new Queue<PivotTelemetryPacket>(TELEMETRY_QUEUE_NAME, {
      connection: getRedisConnection(redisUrl),
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 200,
      },
    });
  }

  async enqueue(packet: PivotTelemetryPacket) {
    await this.queue.add('packet', packet);
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
