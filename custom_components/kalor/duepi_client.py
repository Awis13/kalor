"""Asyncio TCP client for the Duepi EVO protocol.

Ported from TypeScript: src/lib/duepi-client.ts
Protocol: ESC + "R" + cmd + checksum(2 hex) + "&"
Response: 10 ASCII bytes
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from .const import (
    CMD_GET_ERROR,
    CMD_GET_EXH_FAN_RPM,
    CMD_GET_FUMES_TEMP,
    CMD_GET_PELLET_SPEED,
    CMD_GET_POWER_LEVEL,
    CMD_GET_ROOM_TEMP,
    CMD_GET_SETPOINT,
    CMD_GET_STATUS,
    CMD_RESET_ERROR,
    CMD_SET_POWER_OFF,
    CMD_SET_POWER_ON,
    COMMAND_DELAY,
    ERROR_CODES,
    HANDSHAKE_DELAY,
    LOGGER,
    MAX_TEMP,
    MIN_TEMP,
    RESPONSE_LENGTH,
    SOCKET_TIMEOUT,
    STATE_CLEANING,
    STATE_COOLING,
    STATE_ECO,
    STATE_IGNITION,
    STATE_OFF,
    STATE_WORKING,
)

ESC = "\x1b"


@dataclass
class StoveData:
    """Stove state — result of a full poll."""

    status_raw: int  # Raw 32-bit status
    status_text: str  # Human-readable status
    is_on: bool  # Stove is on (burning/ignition/cleaning)
    is_heating: bool  # Actively heating (WORKING | IGNITION)
    room_temp: float  # Room temperature, °C
    target_temp: int  # Target temperature, °C
    fumes_temp: int  # Flue gas temperature, °C
    power_level: int  # Power level (0-6)
    pellet_speed: int  # Pellet feed speed
    fan_speed: int  # Exhaust fan RPM
    alarm_code: int  # Error code (0 = none)
    alarm_text: str  # Error text
    has_alarm: bool  # Active error present


class DuepiConnectionError(Exception):
    """Duepi connection error."""


class DuepiCommandError(Exception):
    """Command execution error."""


class DuepiClient:
    """Asyncio TCP client for the Duepi EVO protocol."""

    def __init__(self, host: str, port: int, device_code: str) -> None:
        self._host = host
        self._port = port
        self._device_code = device_code
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._lock = asyncio.Lock()  # Serialize commands
        self._connected = False

    # --- Connection ---

    async def connect(self) -> None:
        """Connect to the server and send the handshake."""
        await self._cleanup()
        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self._host, self._port),
                timeout=SOCKET_TIMEOUT,
            )
        except (OSError, asyncio.TimeoutError) as err:
            raise DuepiConnectionError(
                f"Failed to connect to {self._host}:{self._port}: {err}"
            ) from err

        # Handshake: "master:{deviceCode}#" (sniffed from the DP Remote app)
        handshake = f"master:{self._device_code}#"
        try:
            self._writer.write(handshake.encode("ascii"))
            await self._writer.drain()
        except OSError as err:
            await self._cleanup()
            raise DuepiConnectionError(f"Handshake error: {err}") from err

        await asyncio.sleep(HANDSHAKE_DELAY)
        self._connected = True
        LOGGER.debug("Connected to %s:%s", self._host, self._port)

    async def disconnect(self) -> None:
        """Close the connection."""
        await self._cleanup()

    async def _cleanup(self) -> None:
        """Close the socket."""
        self._connected = False
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except OSError:
                pass
            self._writer = None
            self._reader = None

    async def _ensure_connected(self) -> None:
        """Reconnect if necessary."""
        if not self._connected or self._writer is None:
            await self.connect()

    # --- Protocol ---

    @staticmethod
    def _calc_checksum(cmd: str) -> str:
        """Checksum: sum of ASCII codes of 'R' + cmd, & 0xFF, uppercase hex."""
        full = "R" + cmd
        s = sum(ord(c) for c in full) & 0xFF
        return f"{s:02X}"

    @staticmethod
    def _build_command(cmd: str) -> bytes:
        """ESC + 'R' + cmd + checksum + '&' → bytes."""
        checksum = DuepiClient._calc_checksum(cmd)
        return (ESC + "R" + cmd + checksum + "&").encode("ascii")

    async def _send_raw(self, cmd: str) -> str:
        """Send a single command and receive a 10-byte response."""
        if not self._writer or not self._reader:
            raise DuepiConnectionError("Not connected")

        raw_cmd = self._build_command(cmd)
        try:
            self._writer.write(raw_cmd)
            await self._writer.drain()
            response = await asyncio.wait_for(
                self._reader.readexactly(RESPONSE_LENGTH),
                timeout=SOCKET_TIMEOUT,
            )
        except (OSError, asyncio.TimeoutError, asyncio.IncompleteReadError) as err:
            self._connected = False
            raise DuepiCommandError(f"Command {cmd} error: {err}") from err

        return response.decode("ascii")

    async def send_command(self, cmd: str) -> str:
        """Send a command through the lock (serialized) with auto-reconnect."""
        async with self._lock:
            await self._ensure_connected()
            try:
                result = await self._send_raw(cmd)
            except (DuepiConnectionError, DuepiCommandError):
                # Single retry with reconnect
                LOGGER.debug("Reconnecting after command %s error", cmd)
                await self.connect()
                result = await self._send_raw(cmd)
            await asyncio.sleep(COMMAND_DELAY)
            return result

    # --- Response parsing ---

    @staticmethod
    def _parse_value(response: str) -> int:
        """Parse the 4-character hex from response[1:5]."""
        try:
            return int(response[1:5], 16)
        except (ValueError, IndexError):
            return 0

    @staticmethod
    def _parse_state(response: str) -> int:
        """Parse the 8-character hex from response[1:9] for the status."""
        try:
            return int(response[1:9], 16)
        except (ValueError, IndexError):
            return 0

    @staticmethod
    def _get_status_text(state: int) -> str:
        """Map the 32-bit status to text."""
        if state & STATE_WORKING:
            return "Working"
        if state & STATE_IGNITION:
            return "Ignition"
        if state & STATE_CLEANING:
            return "Cleaning"
        if state & STATE_COOLING:
            return "Cooling"
        if state & STATE_ECO:
            return "Eco Standby"
        if state & STATE_OFF or state == 0:
            return "Off"
        return f"Unknown (0x{state:08x})"

    @staticmethod
    def _is_stove_on(state: int) -> bool:
        """Stove is on: burning, ignition or cleaning."""
        return bool(state & (STATE_WORKING | STATE_IGNITION | STATE_CLEANING))

    @staticmethod
    def _is_heating(state: int) -> bool:
        """Actively heating: burning or ignition."""
        return bool(state & (STATE_WORKING | STATE_IGNITION))

    # --- Public methods ---

    async def async_get_stove_data(self) -> StoveData:
        """Full poll of all registers — 8 sequential commands."""
        status_resp = await self.send_command(CMD_GET_STATUS)
        status_raw = self._parse_state(status_resp)

        room_raw = self._parse_value(await self.send_command(CMD_GET_ROOM_TEMP))
        fumes_raw = self._parse_value(await self.send_command(CMD_GET_FUMES_TEMP))
        power_raw = self._parse_value(await self.send_command(CMD_GET_POWER_LEVEL))
        pellet_raw = self._parse_value(await self.send_command(CMD_GET_PELLET_SPEED))
        fan_raw = self._parse_value(await self.send_command(CMD_GET_EXH_FAN_RPM))
        error_raw = self._parse_value(await self.send_command(CMD_GET_ERROR))
        setpoint_raw = self._parse_value(await self.send_command(CMD_GET_SETPOINT))

        return StoveData(
            status_raw=status_raw,
            status_text=self._get_status_text(status_raw),
            is_on=self._is_stove_on(status_raw),
            is_heating=self._is_heating(status_raw),
            room_temp=room_raw / 10,
            target_temp=setpoint_raw,
            fumes_temp=fumes_raw,
            power_level=power_raw,
            pellet_speed=pellet_raw,
            fan_speed=fan_raw * 10,
            alarm_code=error_raw,
            alarm_text=ERROR_CODES.get(error_raw, f"Error {error_raw}"),
            has_alarm=error_raw > 0,
        )

    async def async_power_on(self) -> None:
        """Turn on the stove."""
        await self.send_command(CMD_SET_POWER_ON)

    async def async_power_off(self) -> None:
        """Turn off the stove."""
        await self.send_command(CMD_SET_POWER_OFF)

    async def async_set_power_level(self, level: int) -> None:
        """Set power 0-6 (6=auto). Command: F00{x}0."""
        clamped = max(0, min(6, level))
        cmd = f"F00{clamped}0"
        await self.send_command(cmd)

    async def async_set_target_temp(self, temp: int) -> None:
        """Set target temperature 10-35°C. Command: F2{xx}0."""
        clamped = max(MIN_TEMP, min(MAX_TEMP, round(temp)))
        hex_val = f"{clamped:02X}"
        cmd = f"F2{hex_val}0"
        await self.send_command(cmd)

    async def async_reset_error(self) -> None:
        """Reset the error."""
        await self.send_command(CMD_RESET_ERROR)

    async def async_test_connection(self) -> bool:
        """Test the connection — read the status."""
        try:
            await self.connect()
            await self.send_command(CMD_GET_STATUS)
            return True
        except (DuepiConnectionError, DuepiCommandError):
            return False
        finally:
            await self.disconnect()
