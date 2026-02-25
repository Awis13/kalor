"""Константы интеграции Kalor — Duepi EVO protocol."""

from __future__ import annotations

import logging
from datetime import timedelta

DOMAIN = "kalor"
LOGGER = logging.getLogger(__package__)

# Интервал поллинга — 12 секунд (как в TypeScript оригинале)
SCAN_INTERVAL = timedelta(seconds=12)

# Дефолтные параметры подключения
DEFAULT_HOST = "duepiwebserver2.com"
DEFAULT_PORT = 3000

# --- Duepi EVO protocol: команды чтения ---
CMD_GET_STATUS = "D9000"  # 32-bit status flags
CMD_GET_ROOM_TEMP = "D1000"  # Комнатная температура (value / 10)
CMD_GET_FUMES_TEMP = "D0000"  # Температура дымовых газов
CMD_GET_POWER_LEVEL = "D3000"  # Мощность (0-5, 6=auto)
CMD_GET_PELLET_SPEED = "D4000"  # Скорость подачи пеллет
CMD_GET_EXH_FAN_RPM = "EF000"  # Обороты вытяжки (×10)
CMD_GET_ERROR = "DA000"  # Код ошибки
CMD_GET_SETPOINT = "C6000"  # Целевая температура

# --- Duepi EVO protocol: команды записи ---
CMD_SET_POWER_OFF = "F0000"  # Выключить (тихо)
CMD_SET_POWER_ON = "F0010"  # Включить (тихо)
CMD_RESET_ERROR = "D6000"  # Сброс ошибки
# SET_POWER_LEVEL: F00{x}0 — x = 0-6 (6=auto)
# SET_TEMPERATURE: F2{xx}0 — xx = hex температура

# --- Status bit flags (32-bit ответ GET_STATUS) ---
STATE_OFF = 0x00000020
STATE_IGNITION = 0x01000000  # Розжиг
STATE_WORKING = 0x02000000  # Горит
STATE_CLEANING = 0x04000000  # Чистка
STATE_COOLING = 0x08000000  # Остывание
STATE_ECO = 0x10000000  # ECO standby

# --- Коды ошибок ---
ERROR_CODES: dict[int, str] = {
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
}

# --- Диапазоны ---
MIN_TEMP = 10
MAX_TEMP = 35
MIN_POWER = 0
MAX_POWER = 6  # 0-5 ручной + 6=auto

# --- TCP протокол ---
COMMAND_DELAY = 0.2  # 200 мс между командами
SOCKET_TIMEOUT = 5.0  # 5 сек таймаут сокета
RESPONSE_LENGTH = 10  # Ответ всегда 10 байт ASCII
HANDSHAKE_DELAY = 0.5  # 500 мс после хендшейка
