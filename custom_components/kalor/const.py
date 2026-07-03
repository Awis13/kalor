"""Kalor integration constants — Duepi EVO protocol."""

from __future__ import annotations

import logging
from datetime import timedelta

DOMAIN = "kalor"
LOGGER = logging.getLogger(__package__)

# Polling interval — 12 seconds (as in the TypeScript original)
SCAN_INTERVAL = timedelta(seconds=12)

# Default connection parameters
DEFAULT_HOST = "duepiwebserver2.com"
DEFAULT_PORT = 3000

# --- Duepi EVO protocol: read commands ---
CMD_GET_STATUS = "D9000"  # 32-bit status flags
CMD_GET_ROOM_TEMP = "D1000"  # Room temperature (value / 10)
CMD_GET_FUMES_TEMP = "D0000"  # Flue gas temperature
CMD_GET_POWER_LEVEL = "D3000"  # Power (0-5, 6=auto)
CMD_GET_PELLET_SPEED = "D4000"  # Pellet feed speed
CMD_GET_EXH_FAN_RPM = "EF000"  # Exhaust fan RPM (×10)
CMD_GET_ERROR = "DA000"  # Error code
CMD_GET_SETPOINT = "C6000"  # Target temperature

# --- Duepi EVO protocol: write commands ---
CMD_SET_POWER_OFF = "F0000"  # Turn off (silent)
CMD_SET_POWER_ON = "F0010"  # Turn on (silent)
CMD_RESET_ERROR = "D6000"  # Reset error
# SET_POWER_LEVEL: F00{x}0 — x = 0-6 (6=auto)
# SET_TEMPERATURE: F2{xx}0 — xx = hex temperature

# --- Status bit flags (32-bit GET_STATUS response) ---
STATE_OFF = 0x00000020
STATE_IGNITION = 0x01000000  # Ignition
STATE_WORKING = 0x02000000  # Burning
STATE_CLEANING = 0x04000000  # Cleaning
STATE_COOLING = 0x08000000  # Cooling down
STATE_ECO = 0x10000000  # ECO standby

# --- Error codes ---
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

# --- Ranges ---
MIN_TEMP = 10
MAX_TEMP = 35
MIN_POWER = 0
MAX_POWER = 6  # 0-5 manual + 6=auto

# --- TCP protocol ---
COMMAND_DELAY = 0.2  # 200 ms between commands
SOCKET_TIMEOUT = 5.0  # 5 s socket timeout
RESPONSE_LENGTH = 10  # Response is always 10 ASCII bytes
HANDSHAKE_DELAY = 0.5  # 500 ms after the handshake
