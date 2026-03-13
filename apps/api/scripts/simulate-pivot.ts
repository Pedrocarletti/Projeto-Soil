import mqtt from 'mqtt';

const brokerUrl = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
const pivotCode = process.argv[2] ?? 'pivot-norte';
const topic = `pivots/${pivotCode}/telemetry`;

const PivotDirection = {
  CLOCKWISE: 'clockwise',
  STOPPED: 'stopped',
} as const;

const packets = [
  {
    pivotCode,
    isOn: true,
    direction: PivotDirection.CLOCKWISE,
    isIrrigating: true,
    angle: 0,
    percentimeter: 55,
  },
  {
    pivotCode,
    isOn: true,
    direction: PivotDirection.CLOCKWISE,
    isIrrigating: true,
    angle: 22.5,
    percentimeter: 55,
  },
  {
    pivotCode,
    isOn: true,
    direction: PivotDirection.CLOCKWISE,
    isIrrigating: true,
    angle: 45,
    percentimeter: 55,
  },
  {
    pivotCode,
    isOn: false,
    direction: PivotDirection.STOPPED,
    isIrrigating: false,
    angle: 45,
    percentimeter: 0,
  },
];

async function main() {
  const client = mqtt.connect(brokerUrl);

  client.on('connect', async () => {
    for (const packet of packets) {
      const payload = JSON.stringify({
        ...packet,
        timestamp: new Date().toISOString(),
        source: 'simulator',
      });

      await new Promise<void>((resolve, reject) => {
        client.publish(topic, payload, { qos: 1 }, (error) => {
          if (error) {
            reject(error);
            return;
          }

          console.log(`Published to ${topic}: ${payload}`);
          resolve();
        });
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });
    }

    client.end(true);
  });
}

void main();
