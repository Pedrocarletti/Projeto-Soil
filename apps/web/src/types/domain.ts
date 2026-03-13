export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
}

export interface Farm {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface Cycle {
  id: string;
  timestamp: string;
  angle: number;
  percentimeter: number;
  appliedBlade: number;
}

export interface PivotState {
  id: string;
  timestamp: string;
  endedAt: string | null;
  isOn: boolean;
  direction: 'CLOCKWISE' | 'COUNTER_CLOCKWISE' | 'STOPPED';
  isIrrigating: boolean;
  commandedPercentimeter: number | null;
  cycles: Cycle[];
}

export interface PivotLiveState {
  isOn: boolean;
  direction: string;
  isIrrigating: boolean;
  angle: number;
  percentimeter: number;
  appliedBlade: number;
}

export interface Pivot {
  id: string;
  farmId: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  bladeAt100: number;
  status: Record<string, unknown> | null;
  farm: Farm;
  states: PivotState[];
  live: PivotLiveState;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: Record<string, number | string | null>;
  daily: Record<string, Array<number | string | null>>;
}
