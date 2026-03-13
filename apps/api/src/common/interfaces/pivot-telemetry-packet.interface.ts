import { PivotDirection } from '../enums/pivot-direction.enum';

export interface PivotTelemetryPacket {
  pivotId?: string;
  pivotCode?: string;
  timestamp?: string;
  isOn: boolean;
  direction: PivotDirection;
  isIrrigating: boolean;
  angle?: number;
  percentimeter?: number;
  source?: string;
  topic?: string;
}
