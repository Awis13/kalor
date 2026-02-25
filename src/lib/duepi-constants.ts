// Duepi EVO serial protocol — константы и коды команд
// Reverse-engineered из DP Remote и aceindy/Duepi_EVO

// Команды чтения (R = Read, D/C/E prefix)
export const CMD = {
  // Чтение данных
  GET_STATUS:       "D9000", // Статус горелки (32-bit flags)
  GET_ROOM_TEMP:    "D1000", // Комнатная температура (value/10)
  GET_FUMES_TEMP:   "D0000", // Температура дымовых газов
  GET_POWER_LEVEL:  "D3000", // Скорость вентилятора / мощность
  GET_PELLET_SPEED: "D4000", // Скорость подачи пеллет
  GET_EXH_FAN_RPM:  "EF000", // Обороты вытяжного вентилятора (×10)
  GET_ERROR:        "DA000", // Код ошибки
  GET_SETPOINT:     "C6000", // Целевая температура
  GET_FW_VERSION:   "DC000", // Версия прошивки
  GET_PCB_TEMP:     "DF000", // Температура платы
  GET_AMB_FAN:      "D2000", // Скорость комнатного вентилятора
  GET_HOPPER:       "DB000", // Датчик бункера пеллет

  // Запись (последний символ: 0=silent, 1=beep)
  SET_POWER_OFF:    "F0000", // Выключить (тихо)
  SET_POWER_ON:     "F0010", // Включить (тихо)
  // SET_POWER_LEVEL: "F00x?" — x = 0-5 (0=off, 1-5=levels, 6=auto), ? = 0 silent / 1 beep
  // SET_TEMPERATURE: "F2xx?" — xx = hex температура, ? = 0 silent / 1 beep
  RESET_ERROR:      "D6000", // Сброс ошибки
} as const;

// Status bit flags (из 32-bit ответа GET_STATUS)
export const STATE_FLAGS = {
  STATE_OFF:   0x00000020,
  STATE_START: 0x01000000, // Розжиг
  STATE_ON:    0x02000000, // Горит
  STATE_CLEAN: 0x04000000, // Чистка
  STATE_COOL:  0x08000000, // Остывание
  STATE_ECO:   0x10000000, // ECO standby
  STATE_ACK:   0x00000020, // ACK бит (для записи)
} as const;

// Маппинг статусов в человекочитаемый текст
export function getStatusText(state: number): string {
  if (state & STATE_FLAGS.STATE_ON)    return "Working";
  if (state & STATE_FLAGS.STATE_START) return "Ignition";
  if (state & STATE_FLAGS.STATE_CLEAN) return "Cleaning";
  if (state & STATE_FLAGS.STATE_COOL)  return "Cooling";
  if (state & STATE_FLAGS.STATE_ECO)   return "Eco Standby";
  if (state & STATE_FLAGS.STATE_OFF)   return "Off";
  if (state === 0) return "Off";
  return `Unknown (0x${state.toString(16)})`;
}

// Маппинг статуса в числовой код для UI (совместимость с фронтом)
export function getStatusCode(state: number): number {
  if (state & STATE_FLAGS.STATE_ON)    return 4; // Working
  if (state & STATE_FLAGS.STATE_START) return 1; // Ignition
  if (state & STATE_FLAGS.STATE_CLEAN) return 5; // Cleaning
  if (state & STATE_FLAGS.STATE_COOL)  return 8; // Cooling
  if (state & STATE_FLAGS.STATE_ECO)   return 7; // Standby/Eco
  return 0; // Off
}

export function isStoveOn(state: number): boolean {
  return !!(state & (STATE_FLAGS.STATE_ON | STATE_FLAGS.STATE_START | STATE_FLAGS.STATE_CLEAN));
}

// Коды ошибок
export const ERROR_CODES: Record<number, string> = {
  0: "No error",
  1: "No ignition",
  2: "No flame",
  3: "Overheating",
  4: "Exhaust probe error",
  5: "No flame (timeout)",
  6: "Pellet jam",
  7: "Door open",
  8: "Pressure switch",
  9: "Clean brazier",
  10: "Water pressure low",
  11: "Water too hot",
  12: "Safety thermostat",
  13: "Blackout",
  14: "Air probe error",
};

// Уровни мощности для UI
export const POWER_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export const POWER_LABELS: Record<number, string> = {
  0: "Off",
  1: "Min",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Max",
  6: "Auto",
};
