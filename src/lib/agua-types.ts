// Типы для Kalor stove controller

// Состояние печи для фронтенда
export interface StoveState {
  // Основные параметры
  status: number;
  statusText: string;
  isOn: boolean;

  // Температуры
  roomTemp: number;
  targetTemp: number;
  fumesTemp: number;
  waterTemp: number;

  // Управление
  powerLevel: number;
  fanSpeed: number;

  // Расширенная телеметрия
  waterPressure: number;
  flamePower: number;
  pelletLoadTime: number;
  cpuCounter: number;

  // Аларм
  alarmCode: number;
  alarmText: string;
  hasAlarm: boolean;

  // Мета
  isOnline: boolean;
  lastUpdate: number; // unix timestamp

  // Все сырые регистры для телеметрии
  rawRegisters: Record<string, number>;
}

// Параметры для телеметрии gauge
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

// Расписание
export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0=пн, 6=вс
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

// История
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
