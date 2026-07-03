// Types for the Kalor stove controller

// Stove state for the frontend
export interface StoveState {
  // Core parameters
  status: number;
  statusText: string;
  isOn: boolean;

  // Temperatures
  roomTemp: number;
  targetTemp: number;
  fumesTemp: number;
  waterTemp: number;

  // Controls
  powerLevel: number;
  fanSpeed: number;

  // Extended telemetry
  waterPressure: number;
  flamePower: number;
  pelletLoadTime: number;
  cpuCounter: number;

  // Alarm
  alarmCode: number;
  alarmText: string;
  hasAlarm: boolean;

  // Meta
  isOnline: boolean;
  lastUpdate: number; // unix timestamp

  // All raw registers for telemetry
  rawRegisters: Record<string, number>;
}

// Parameters for a telemetry gauge
export interface GaugeZone {
  min: number;
  max: number;
  color: string;
}

export interface GaugeConfig {
  label: string;
  unit: string;
  min: number;
  max: number;
  registerKey: string;
  zones: GaugeZone[];
  decimals?: number;
}

// Schedule
export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0=Mon, 6=Sun
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  targetTemp: number;
  powerLevel: number;
  enabled: boolean;
}

export interface ScheduleDay {
  dayOfWeek: number;
  label: string;
  slots: ScheduleSlot[];
}

// History
export interface HistoryEntry {
  timestamp: number;
  roomTemp: number;
  targetTemp: number;
  fumesTemp: number;
  waterTemp: number;
  powerLevel: number;
  fanSpeed: number;
  status: number;
  flamePower: number;
}
