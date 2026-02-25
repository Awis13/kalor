"""Climate entity для Kalor — HEAT/OFF, управление температурой."""

from __future__ import annotations

from typing import Any

from homeassistant.components.climate import (
    ClimateEntity,
    ClimateEntityFeature,
    HVACAction,
    HVACMode,
)
from homeassistant.const import ATTR_TEMPERATURE, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import MAX_TEMP, MIN_TEMP
from .coordinator import KalorConfigEntry, KalorCoordinator
from .duepi_client import DuepiCommandError, DuepiConnectionError
from .entity import KalorEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: KalorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Создание climate entity."""
    async_add_entities([KalorClimateEntity(entry.runtime_data)])


class KalorClimateEntity(KalorEntity, ClimateEntity):
    """Климат-entity Kalor Petit — HEAT/OFF, управление температурой."""

    _attr_name = None  # Имя = имя устройства
    _attr_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_target_temperature_step = 1.0
    _attr_min_temp = float(MIN_TEMP)
    _attr_max_temp = float(MAX_TEMP)
    _attr_hvac_modes = [HVACMode.HEAT, HVACMode.OFF]
    _attr_supported_features = (
        ClimateEntityFeature.TARGET_TEMPERATURE
        | ClimateEntityFeature.TURN_ON
        | ClimateEntityFeature.TURN_OFF
    )

    def __init__(self, coordinator: KalorCoordinator) -> None:
        """Инициализация climate entity."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.unique_id}-climate"

    @property
    def hvac_mode(self) -> HVACMode:
        """Текущий режим: HEAT если горит, иначе OFF."""
        if self.coordinator.data and self.coordinator.data.is_on:
            return HVACMode.HEAT
        return HVACMode.OFF

    @property
    def hvac_action(self) -> HVACAction:
        """Текущее действие: HEATING, IDLE или OFF."""
        data = self.coordinator.data
        if data is None:
            return HVACAction.OFF
        if data.is_heating:
            return HVACAction.HEATING
        if data.is_on:
            return HVACAction.IDLE  # Чистка, остывание и т.д.
        return HVACAction.OFF

    @property
    def current_temperature(self) -> float | None:
        """Текущая комнатная температура."""
        if self.coordinator.data:
            return self.coordinator.data.room_temp
        return None

    @property
    def target_temperature(self) -> float | None:
        """Целевая температура."""
        if self.coordinator.data:
            return float(self.coordinator.data.target_temp)
        return None

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Переключение режима: HEAT = включить, OFF = выключить."""
        try:
            if hvac_mode == HVACMode.HEAT:
                await self.coordinator.client.async_power_on()
            else:
                await self.coordinator.client.async_power_off()
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(f"Ошибка переключения режима: {err}") from err
        await self.coordinator.async_request_refresh()

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Установка целевой температуры."""
        temp = kwargs.get(ATTR_TEMPERATURE)
        if temp is None:
            return
        try:
            await self.coordinator.client.async_set_target_temp(int(temp))
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(f"Ошибка установки температуры: {err}") from err
        await self.coordinator.async_request_refresh()

    async def async_turn_on(self) -> None:
        """Включить печь."""
        await self.async_set_hvac_mode(HVACMode.HEAT)

    async def async_turn_off(self) -> None:
        """Выключить печь."""
        await self.async_set_hvac_mode(HVACMode.OFF)
