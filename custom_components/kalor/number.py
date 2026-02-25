"""Number entity: управление мощностью Kalor (0-6, где 6=auto)."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import MAX_POWER, MIN_POWER
from .coordinator import KalorConfigEntry, KalorCoordinator
from .duepi_client import DuepiCommandError, DuepiConnectionError
from .entity import KalorEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: KalorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Создание number entity."""
    async_add_entities([KalorPowerLevelNumber(entry.runtime_data)])


class KalorPowerLevelNumber(KalorEntity, NumberEntity):
    """Слайдер мощности: 0-5 (ручной) + 6 (auto)."""

    _attr_translation_key = "power_level"
    _attr_native_min_value = float(MIN_POWER)
    _attr_native_max_value = float(MAX_POWER)
    _attr_native_step = 1.0
    _attr_mode = NumberMode.SLIDER

    def __init__(self, coordinator: KalorCoordinator) -> None:
        """Инициализация number entity."""
        super().__init__(coordinator)
        self._attr_unique_id = (
            f"{coordinator.config_entry.unique_id}-power_level_ctrl"
        )

    @property
    def native_value(self) -> float | None:
        """Текущий уровень мощности."""
        if self.coordinator.data is None:
            return None
        return float(self.coordinator.data.power_level)

    async def async_set_native_value(self, value: float) -> None:
        """Установить мощность."""
        try:
            await self.coordinator.client.async_set_power_level(int(value))
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(
                f"Ошибка установки мощности: {err}"
            ) from err
        await self.coordinator.async_request_refresh()
