// Коды статусов печи Micronova
export const STOVE_STATUSES: Record<number, string> = {
  0: "Off",
  1: "Ignition",
  2: "Flame Start",
  3: "Stabilizing",
  4: "Working",
  5: "Cleaning Fire",
  6: "Cleaning Final",
  7: "Standby",
  8: "Cooling",
  9: "Safety",
  10: "Lockout",
  11: "Recovery",
  12: "Modulation ECO",
};

// Цвета статусов для бейджа
export const STATUS_COLORS: Record<number, string> = {
  0: "gray",
  1: "amber",
  2: "amber",
  3: "amber",
  4: "green",
  5: "yellow",
  6: "yellow",
  7: "blue",
  8: "blue",
  9: "red",
  10: "red",
  11: "amber",
  12: "green",
};

// Ключи регистров (маппинг имён на rawRegisters из DuepiClient)
export const REGISTER_KEYS = {
  STATUS: "status",
  ROOM_TEMP: "room_temp_c",
  FUMES_TEMP: "fumes_temp_c",
  TARGET_TEMP: "setpoint",
  POWER: "power_level",
  FAN: "exh_fan_rpm_actual",
  ALARM: "error",
  PELLET_SPEED: "pellet_speed",
} as const;

// Конфиг для gauge'ей телеметрии (Kalor Petit — воздушная печь)
export const TELEMETRY_GAUGES = [
  {
    label: "Room",
    unit: "\u00B0C",
    min: 0,
    max: 40,
    registerKey: "room_temp_c",
    decimals: 1,
    zones: [
      { min: 0, max: 15, color: "#3b82f6" },   // синий — холодно
      { min: 15, max: 25, color: "#22c55e" },   // зелёный — комфорт
      { min: 25, max: 40, color: "#ef4444" },   // красный — жарко
    ],
  },
  {
    label: "Fumes",
    unit: "\u00B0C",
    min: 0,
    max: 300,
    registerKey: "fumes_temp_c",
    decimals: 0,
    zones: [
      { min: 0, max: 100, color: "#22c55e" },
      { min: 100, max: 200, color: "#f59e0b" },
      { min: 200, max: 300, color: "#ef4444" },
    ],
  },
  {
    label: "Power",
    unit: "level",
    min: 0,
    max: 5,
    registerKey: "power_level",
    decimals: 0,
    zones: [
      { min: 0, max: 2, color: "#3b82f6" },
      { min: 2, max: 4, color: "#f59e0b" },
      { min: 4, max: 5, color: "#ef4444" },
    ],
  },
  {
    label: "Exhaust Fan",
    unit: "RPM",
    min: 0,
    max: 3000,
    registerKey: "exh_fan_rpm_actual",
    decimals: 0,
    zones: [
      { min: 0, max: 1000, color: "#22c55e" },
      { min: 1000, max: 2000, color: "#f59e0b" },
      { min: 2000, max: 3000, color: "#ef4444" },
    ],
  },
  {
    label: "Pellet Feed",
    unit: "speed",
    min: 0,
    max: 10,
    registerKey: "pellet_speed",
    decimals: 0,
    zones: [
      { min: 0, max: 3, color: "#22c55e" },
      { min: 3, max: 7, color: "#f59e0b" },
      { min: 7, max: 10, color: "#ef4444" },
    ],
  },
  {
    label: "Target",
    unit: "\u00B0C",
    min: 10,
    max: 35,
    registerKey: "setpoint",
    decimals: 0,
    zones: [
      { min: 10, max: 20, color: "#3b82f6" },
      { min: 20, max: 28, color: "#22c55e" },
      { min: 28, max: 35, color: "#ef4444" },
    ],
  },
] as const;

// Дни недели
export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// Интервал поллинга (мс)
export const POLL_INTERVAL = 12_000;
