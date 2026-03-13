import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { type MqttClient } from 'mqtt';
import type { PivotTelemetryPacket } from '../common/interfaces/pivot-telemetry-packet.interface';
import { PivotDirection } from '../common/enums/pivot-direction.enum';
import { TelemetryQueueService } from './telemetry-queue.service';

@Injectable()
export class TelemetryMqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryMqttService.name);
  private client?: MqttClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly telemetryQueueService: TelemetryQueueService,
  ) {}

  onModuleInit() {
    const mqttUrl = this.configService.get<string>('MQTT_URL');

    if (!mqttUrl) {
      this.logger.warn('MQTT_URL not set. MQTT subscription disabled.');
      return;
    }

    this.client = mqtt.connect(mqttUrl, {
      username: this.configService.get('MQTT_USERNAME'),
      password: this.configService.get('MQTT_PASSWORD'),
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      const topicPattern =
        this.configService.get<string>('MQTT_TOPIC_PATTERN') ??
        'pivots/+/telemetry';
      const topics = topicPattern
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);

      for (const topic of topics) {
        this.client?.subscribe(topic, { qos: 1 });
      }

      this.logger.log(`Subscribed to MQTT topics: ${topics.join(', ')}`);
    });

    this.client.on('message', (topic, payload) => {
      void this.handleMessage(topic, payload);
    });

    this.client.on('error', (error) => {
      this.logger.error(`MQTT client error: ${error.message}`);
    });
  }

  async publishCommand(pivotCode: string, payload: Record<string, unknown>) {
    const topicTemplate =
      this.configService.get<string>('MQTT_COMMAND_TOPIC') ??
      'pivots/{code}/commands';
    const topic = topicTemplate.replace('{code}', pivotCode);

    if (!this.client || !this.client.connected) {
      this.logger.warn(
        `MQTT client not connected. Command queued only for ${pivotCode}.`,
      );
      return {
        topic,
        published: false,
      };
    }

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(
        topic,
        JSON.stringify(payload),
        { qos: 1 },
        (error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        },
      );
    });

    return {
      topic,
      published: true,
    };
  }

  async onModuleDestroy() {
    if (!this.client) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.client?.end(false, {}, () => resolve());
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const rawPacket = JSON.parse(
        payload.toString(),
      ) as Partial<PivotTelemetryPacket>;
      const packet: PivotTelemetryPacket = {
        pivotCode: rawPacket.pivotCode,
        pivotId: rawPacket.pivotId,
        timestamp: rawPacket.timestamp,
        isOn: rawPacket.isOn ?? false,
        direction: rawPacket.direction ?? PivotDirection.STOPPED,
        isIrrigating: rawPacket.isIrrigating ?? false,
        angle: rawPacket.angle,
        percentimeter: rawPacket.percentimeter,
        source: rawPacket.source ?? 'mqtt',
        topic,
      };

      await this.telemetryQueueService.enqueue(packet);
    } catch (error) {
      this.logger.error(
        `Failed to parse MQTT payload from ${topic}: ${(error as Error).message}`,
      );
    }
  }
}
