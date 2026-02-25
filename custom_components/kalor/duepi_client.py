"""Asyncio TCP клиент для Duepi EVO protocol.

Порт из TypeScript: src/lib/duepi-client.ts
Протокол: ESC + "R" + cmd + checksum(2 hex) + "&"
Ответ: 10 байт ASCII
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
    """Состояние печи — результат полного поллинга."""

    status_raw: int  # Сырой 32-bit статус
    status_text: str  # Человекочитаемый статус
    is_on: bool  # Печь включена (горит/розжиг/чистка)
    is_heating: bool  # Активно нагревает (WORKING | IGNITION)
    room_temp: float  # Комнатная температура, °C
    target_temp: int  # Целевая температура, °C
    fumes_temp: int  # Температура дымовых газов, °C
    power_level: int  # Уровень мощности (0-6)
    pellet_speed: int  # Скорость подачи пеллет
    fan_speed: int  # Обороты вытяжки, RPM
    alarm_code: int  # Код ошибки (0 = нет)
    alarm_text: str  # Текст ошибки
    has_alarm: bool  # Есть активная ошибка


class DuepiConnectionError(Exception):
    """Ошибка подключения к Duepi."""


class DuepiCommandError(Exception):
    """Ошибка выполнения команды."""


class DuepiClient:
    """Asyncio TCP клиент для Duepi EVO protocol."""

    def __init__(self, host: str, port: int, device_code: str) -> None:
        self._host = host
        self._port = port
        self._device_code = device_code
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._lock = asyncio.Lock()  # Сериализация команд
        self._connected = False

    # --- Подключение ---

    async def connect(self) -> None:
        """Подключиться к серверу и отправить хендшейк."""
        await self._cleanup()
        try:
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self._host, self._port),
                timeout=SOCKET_TIMEOUT,
            )
        except (OSError, asyncio.TimeoutError) as err:
            raise DuepiConnectionError(
                f"Не удалось подключиться к {self._host}:{self._port}: {err}"
            ) from err

        # Хендшейк: "master:{deviceCode}#" (снифнуто из DP Remote app)
        handshake = f"master:{self._device_code}#"
        try:
            self._writer.write(handshake.encode("ascii"))
            await self._writer.drain()
        except OSError as err:
            await self._cleanup()
            raise DuepiConnectionError(f"Ошибка хендшейка: {err}") from err

        await asyncio.sleep(HANDSHAKE_DELAY)
        self._connected = True
        LOGGER.debug("Подключено к %s:%s", self._host, self._port)

    async def disconnect(self) -> None:
        """Закрыть соединение."""
        await self._cleanup()

    async def _cleanup(self) -> None:
        """Закрыть сокет."""
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
        """Переподключиться если нужно."""
        if not self._connected or self._writer is None:
            await self.connect()

    # --- Протокол ---

    @staticmethod
    def _calc_checksum(cmd: str) -> str:
        """Checksum: сумма ASCII кодов 'R' + cmd, & 0xFF, hex uppercase."""
        full = "R" + cmd
        s = sum(ord(c) for c in full) & 0xFF
        return f"{s:02X}"

    @staticmethod
    def _build_command(cmd: str) -> bytes:
        """ESC + 'R' + cmd + checksum + '&' → bytes."""
        checksum = DuepiClient._calc_checksum(cmd)
        return (ESC + "R" + cmd + checksum + "&").encode("ascii")

    async def _send_raw(self, cmd: str) -> str:
        """Отправить одну команду, получить 10-байтный ответ."""
        if not self._writer or not self._reader:
            raise DuepiConnectionError("Нет подключения")

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
            raise DuepiCommandError(f"Ошибка команды {cmd}: {err}") from err

        return response.decode("ascii")

    async def send_command(self, cmd: str) -> str:
        """Отправить команду через lock (сериализация) с авто-реконнектом."""
        async with self._lock:
            await self._ensure_connected()
            try:
                result = await self._send_raw(cmd)
            except (DuepiConnectionError, DuepiCommandError):
                # Один ретрай с переподключением
                LOGGER.debug("Реконнект после ошибки команды %s", cmd)
                await self.connect()
                result = await self._send_raw(cmd)
            await asyncio.sleep(COMMAND_DELAY)
            return result

    # --- Парсинг ответов ---

    @staticmethod
    def _parse_value(response: str) -> int:
        """Парсинг 4-символьного hex из ответа [1:5]."""
        try:
            return int(response[1:5], 16)
        except (ValueError, IndexError):
            return 0

    @staticmethod
    def _parse_state(response: str) -> int:
        """Парсинг 8-символьного hex из ответа [1:9] для статуса."""
        try:
            return int(response[1:9], 16)
        except (ValueError, IndexError):
            return 0

    @staticmethod
    def _get_status_text(state: int) -> str:
        """Маппинг 32-bit статуса в текст."""
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
        """Печь включена: горит, розжиг или чистка."""
        return bool(state & (STATE_WORKING | STATE_IGNITION | STATE_CLEANING))

    @staticmethod
    def _is_heating(state: int) -> bool:
        """Активно нагревает: горит или розжиг."""
        return bool(state & (STATE_WORKING | STATE_IGNITION))

    # --- Публичные методы ---

    async def async_get_stove_data(self) -> StoveData:
        """Полный поллинг всех регистров — 8 последовательных команд."""
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
        """Включить печь."""
        await self.send_command(CMD_SET_POWER_ON)

    async def async_power_off(self) -> None:
        """Выключить печь."""
        await self.send_command(CMD_SET_POWER_OFF)

    async def async_set_power_level(self, level: int) -> None:
        """Установить мощность 0-6 (6=auto). Команда: F00{x}0."""
        clamped = max(0, min(6, level))
        cmd = f"F00{clamped}0"
        await self.send_command(cmd)

    async def async_set_target_temp(self, temp: int) -> None:
        """Установить целевую температуру 10-35°C. Команда: F2{xx}0."""
        clamped = max(MIN_TEMP, min(MAX_TEMP, round(temp)))
        hex_val = f"{clamped:02X}"
        cmd = f"F2{hex_val}0"
        await self.send_command(cmd)

    async def async_reset_error(self) -> None:
        """Сброс ошибки."""
        await self.send_command(CMD_RESET_ERROR)

    async def async_test_connection(self) -> bool:
        """Тест подключения — читаем статус."""
        try:
            await self.connect()
            await self.send_command(CMD_GET_STATUS)
            return True
        except (DuepiConnectionError, DuepiCommandError):
            return False
        finally:
            await self.disconnect()
