"""Climate entity for Kalor — HEAT/OFF, temperature control."""

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
    """Create the climate entity."""
    async_add_entities([KalorClimateEntity(entry.runtime_data)])


class KalorClimateEntity(KalorEntity, ClimateEntity):
    """Kalor Petit climate entity — HEAT/OFF, temperature control."""

    _attr_name = None  # Name = device name
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
        """Initialize the climate entity."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.unique_id}-climate"

    @property
    def hvac_mode(self) -> HVACMode:
        """Current mode: HEAT if burning, otherwise OFF."""
        if self.coordinator.data and self.coordinator.data.is_on:
            return HVACMode.HEAT
        return HVACMode.OFF

    @property
    def hvac_action(self) -> HVACAction:
        """Current action: HEATING, IDLE or OFF."""
        data = self.coordinator.data
        if data is None:
            return HVACAction.OFF
        if data.is_heating:
            return HVACAction.HEATING
        if data.is_on:
            return HVACAction.IDLE  # Cleaning, cooling down, etc.
        return HVACAction.OFF

    @property
    def current_temperature(self) -> float | None:
        """Current room temperature."""
        if self.coordinator.data:
            return self.coordinator.data.room_temp
        return None

    @property
    def target_temperature(self) -> float | None:
        """Target temperature."""
        if self.coordinator.data:
            return float(self.coordinator.data.target_temp)
        return None

    async def async_set_hvac_mode(self, hvac_mode: HVACMode) -> None:
        """Switch mode: HEAT = turn on, OFF = turn off."""
        try:
            if hvac_mode == HVACMode.HEAT:
                await self.coordinator.client.async_power_on()
            else:
                await self.coordinator.client.async_power_off()
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(f"Failed to switch mode: {err}") from err
        await self.coordinator.async_request_refresh()

    async def async_set_temperature(self, **kwargs: Any) -> None:
        """Set the target temperature."""
        temp = kwargs.get(ATTR_TEMPERATURE)
        if temp is None:
            return
        try:
            await self.coordinator.client.async_set_target_temp(int(temp))
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(f"Failed to set temperature: {err}") from err
        await self.coordinator.async_request_refresh()

    async def async_turn_on(self) -> None:
        """Turn on the stove."""
        await self.async_set_hvac_mode(HVACMode.HEAT)

    async def async_turn_off(self) -> None:
        """Turn off the stove."""
        await self.async_set_hvac_mode(HVACMode.OFF)
