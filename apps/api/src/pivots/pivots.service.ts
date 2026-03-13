import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { PivotDirection } from '../common/enums/pivot-direction.enum';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { TelemetryMqttService } from '../telemetry/telemetry-mqtt.service';
import { TelemetryQueueService } from '../telemetry/telemetry-queue.service';
import { ControlPivotDto, PivotIrrigationMode } from './dto/control-pivot.dto';
import { CreatePivotDto } from './dto/create-pivot.dto';
import {
  pivotDetailInclude,
  pivotSummaryInclude,
  presentPivot,
} from './pivot.presenter';

@Injectable()
export class PivotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telemetryQueueService: TelemetryQueueService,
    private readonly telemetryMqttService: TelemetryMqttService,
    private readonly configService: ConfigService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list() {
    const pivots = await this.prisma.pivot.findMany({
      include: pivotSummaryInclude,
      orderBy: { name: 'asc' },
    });

    return pivots.map((pivot) => presentPivot(pivot));
  }

  async findOne(id: string) {
    const pivot = await this.prisma.pivot.findUnique({
      where: { id },
      include: pivotDetailInclude,
    });

    if (!pivot) {
      throw new NotFoundException('Pivot not found.');
    }

    return presentPivot(pivot);
  }

  async history(id: string) {
    await this.findOne(id);

    return this.prisma.state.findMany({
      where: { pivotId: id },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        cycles: {
          orderBy: { timestamp: 'desc' },
          take: 240,
        },
      },
    });
  }

  async create(createPivotDto: CreatePivotDto) {
    const pivot = await this.prisma.pivot.create({
      data: {
        ...createPivotDto,
        status: {
          code: createPivotDto.code,
          isOn: false,
          direction: PivotDirection.STOPPED,
          isIrrigating: false,
          angle: 0,
          percentimeter: 0,
          source: 'manual',
        },
      },
    });

    const snapshot = await this.findOne(pivot.id);
    this.realtimeGateway.emitPivotSnapshot(snapshot);
    this.realtimeGateway.emitPivotDetail(pivot.id, snapshot);

    return snapshot;
  }

  async control(id: string, controlPivotDto: ControlPivotDto) {
    const pivot = await this.prisma.pivot.findUnique({
      where: { id },
    });

    if (!pivot) {
      throw new NotFoundException('Pivot not found.');
    }

    if (
      controlPivotDto.isOn &&
      controlPivotDto.irrigationMode === PivotIrrigationMode.WATER &&
      controlPivotDto.percentimeter === undefined
    ) {
      throw new BadRequestException(
        'Percentimeter is required when irrigating with water.',
      );
    }

    const currentStatus = (pivot.status ?? {}) as Prisma.JsonObject;
    const commandPayload = {
      pivotId: pivot.id,
      pivotCode: pivot.code,
      timestamp: new Date().toISOString(),
      isOn: controlPivotDto.isOn,
      direction: controlPivotDto.isOn
        ? controlPivotDto.direction
        : PivotDirection.STOPPED,
      isIrrigating:
        controlPivotDto.isOn &&
        controlPivotDto.irrigationMode === PivotIrrigationMode.WATER,
      percentimeter: controlPivotDto.isOn
        ? (controlPivotDto.percentimeter ?? 0)
        : 0,
      angle: typeof currentStatus.angle === 'number' ? currentStatus.angle : 0,
      source: 'command',
      irrigationMode: controlPivotDto.irrigationMode,
    };

    const publishResult = await this.telemetryMqttService.publishCommand(
      pivot.code,
      commandPayload,
    );

    const localEchoEnabled =
      (
        this.configService.get<string>('MQTT_LOCAL_ECHO_COMMANDS') ?? 'true'
      ).toLowerCase() === 'true';

    if (localEchoEnabled) {
      await this.telemetryQueueService.enqueue({
        ...commandPayload,
        source: 'command-echo',
      });
    }

    return {
      acknowledged: true,
      publishResult,
      command: commandPayload,
    };
  }
}
