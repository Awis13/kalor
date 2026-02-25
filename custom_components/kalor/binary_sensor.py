"""Binary sensor для алармов Kalor."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import KalorConfigEntry, KalorCoordinator
from .entity import KalorEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: KalorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Создание binary sensor."""
    async_add_entities([KalorAlarmSensor(entry.runtime_data)])


class KalorAlarmSensor(KalorEntity, BinarySensorEntity):
    """Binary sensor: активна ли ошибка на печи."""

    _attr_device_class = BinarySensorDeviceClass.PROBLEM
    _attr_translation_key = "alarm"

    def __init__(self, coordinator: KalorCoordinator) -> None:
        """Инициализация alarm sensor."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.unique_id}-alarm"

    @property
    def is_on(self) -> bool | None:
        """True если есть активная ошибка."""
        if self.coordinator.data is None:
            return None
        return self.coordinator.data.has_alarm

    @property
    def extra_state_attributes(self) -> dict[str, str | int] | None:
        """Дополнительные атрибуты: код и текст ошибки."""
        if self.coordinator.data is None:
            return None
        return {
            "alarm_code": self.coordinator.data.alarm_code,
            "alarm_text": self.coordinator.data.alarm_text,
        }
