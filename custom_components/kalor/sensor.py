"""Сенсоры Kalor — температуры, обороты, мощность, статус."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import REVOLUTIONS_PER_MINUTE, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import KalorConfigEntry, KalorCoordinator
from .duepi_client import StoveData
from .entity import KalorEntity


@dataclass(frozen=True, kw_only=True)
class KalorSensorDescription(SensorEntityDescription):
    """Описание сенсора с лямбдой для извлечения значения."""

    value_fn: Callable[[StoveData], float | int | str | None]


SENSOR_DESCRIPTIONS: tuple[KalorSensorDescription, ...] = (
    KalorSensorDescription(
        key="room_temperature",
        translation_key="room_temperature",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        suggested_display_precision=1,
        value_fn=lambda data: data.room_temp,
    ),
    KalorSensorDescription(
        key="fumes_temperature",
        translation_key="fumes_temperature",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        suggested_display_precision=0,
        value_fn=lambda data: data.fumes_temp,
    ),
    KalorSensorDescription(
        key="exhaust_fan_speed",
        translation_key="exhaust_fan_speed",
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=REVOLUTIONS_PER_MINUTE,
        suggested_display_precision=0,
        value_fn=lambda data: data.fan_speed,
    ),
    KalorSensorDescription(
        key="power_level",
        translation_key="power_level_sensor",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.power_level,
    ),
    KalorSensorDescription(
        key="pellet_feed_speed",
        translation_key="pellet_feed_speed",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data.pellet_speed,
    ),
    KalorSensorDescription(
        key="status",
        translation_key="status",
        value_fn=lambda data: data.status_text,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: KalorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Создание всех сенсоров."""
    coordinator = entry.runtime_data
    async_add_entities(
        KalorSensor(coordinator, desc) for desc in SENSOR_DESCRIPTIONS
    )


class KalorSensor(KalorEntity, SensorEntity):
    """Сенсор Kalor."""

    entity_description: KalorSensorDescription

    def __init__(
        self,
        coordinator: KalorCoordinator,
        description: KalorSensorDescription,
    ) -> None:
        """Инициализация сенсора."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = (
            f"{coordinator.config_entry.unique_id}-{description.key}"
        )

    @property
    def native_value(self) -> float | int | str | None:
        """Значение сенсора из данных координатора."""
        if self.coordinator.data is None:
            return None
        return self.entity_description.value_fn(self.coordinator.data)
