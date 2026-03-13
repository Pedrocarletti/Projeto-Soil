import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';
import type { Pivot } from '@prisma/client';
import type { PivotTelemetryPacket } from '../common/interfaces/pivot-telemetry-packet.interface';
import {
  calculateAppliedBlade,
  toPrismaDirection,
} from '../common/utils/pivot.util';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { getRedisConnection } from '../common/utils/redis.util';
import { pivotDetailInclude, presentPivot } from '../pivots/pivot.presenter';
import { TELEMETRY_QUEUE_NAME } from './telemetry-queue.service';

@Injectable()
export class TelemetryProcessorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TelemetryProcessorService.name);
  private worker?: Worker<PivotTelemetryPacket>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.worker = new Worker<PivotTelemetryPacket>(
      TELEMETRY_QUEUE_NAME,
      async (job) => {
        await this.processPacket(job.data);
      },
      {
        connection: getRedisConnection(redisUrl),
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Telemetry job ${job?.id ?? 'unknown'} failed: ${error.message}`,
      );
    });
  }

  private extractPivotCode(packet: PivotTelemetryPacket) {
    if (packet.pivotCode) {
      return packet.pivotCode;
    }

    if (!packet.topic) {
      return undefined;
    }

    const [, code] = packet.topic.split('/');
    return code;
  }

  private async resolvePivot(packet: PivotTelemetryPacket) {
    if (packet.pivotId) {
      return this.prisma.pivot.findUnique({
        where: { id: packet.pivotId },
      });
    }

    const pivotCode = this.extractPivotCode(packet);

    if (!pivotCode) {
      return null;
    }

    return this.prisma.pivot.findUnique({
      where: { code: pivotCode },
    });
  }

  private async processPacket(packet: PivotTelemetryPacket) {
    const pivot = await this.resolvePivot(packet);

    if (!pivot) {
      this.logger.warn(
        `Ignoring telemetry packet because pivot could not be resolved: ${JSON.stringify(packet)}`,
      );
      return;
    }

    const pivotId = await this.prisma.$transaction(async (tx) => {
      const timestamp = packet.timestamp
        ? new Date(packet.timestamp)
        : new Date();
      const currentPivot = (await tx.pivot.findUnique({
        where: { id: pivot.id },
      })) as Pivot;

      await tx.pivot.update({
        where: { id: pivot.id },
        data: {
          status: {
            pivotId: pivot.id,
            pivotCode: pivot.code,
            receivedAt: timestamp.toISOString(),
            ...packet,
          },
        },
      });

      let activeState = await tx.state.findFirst({
        where: {
          pivotId: pivot.id,
          endedAt: null,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (packet.isOn) {
        if (!activeState) {
          activeState = await tx.state.create({
            data: {
              pivotId: pivot.id,
              timestamp,
              isOn: true,
              direction: toPrismaDirection(packet.direction),
              isIrrigating: packet.isIrrigating,
              commandedPercentimeter:
                typeof packet.percentimeter === 'number'
                  ? Math.round(packet.percentimeter)
                  : null,
            },
          });
        } else {
          activeState = await tx.state.update({
            where: { id: activeState.id },
            data: {
              isOn: true,
              direction: toPrismaDirection(packet.direction),
              isIrrigating: packet.isIrrigating,
              commandedPercentimeter:
                typeof packet.percentimeter === 'number'
                  ? Math.round(packet.percentimeter)
                  : activeState.commandedPercentimeter,
            },
          });
        }

        if (
          typeof packet.angle === 'number' ||
          typeof packet.percentimeter === 'number'
        ) {
          const angle = typeof packet.angle === 'number' ? packet.angle : 0;
          const percentimeter =
            typeof packet.percentimeter === 'number' ? packet.percentimeter : 0;

          await tx.cycle.create({
            data: {
              stateId: activeState.id,
              timestamp,
              angle,
              percentimeter,
              appliedBlade: calculateAppliedBlade(
                currentPivot.bladeAt100,
                percentimeter,
              ),
            },
          });
        }
      } else if (activeState) {
        await tx.state.update({
          where: { id: activeState.id },
          data: {
            isOn: false,
            endedAt: timestamp,
            direction: toPrismaDirection(packet.direction),
            isIrrigating: false,
          },
        });
      }

      return pivot.id;
    });

    const updatedPivot = await this.prisma.pivot.findUnique({
      where: { id: pivotId },
      include: pivotDetailInclude,
    });

    if (!updatedPivot) {
      return;
    }

    const snapshot = presentPivot(updatedPivot);
    this.realtimeGateway.emitPivotSnapshot(snapshot);
    this.realtimeGateway.emitPivotDetail(pivotId, snapshot);
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
