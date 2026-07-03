"""Base class for all Kalor entities."""

from __future__ import annotations

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import KalorCoordinator


class KalorEntity(CoordinatorEntity[KalorCoordinator]):
    """Base entity — device_info and has_entity_name."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: KalorCoordinator) -> None:
        """Initialize with a binding to the device."""
        super().__init__(coordinator)
        device_code = coordinator.config_entry.data["device_code"]
        self._attr_device_info = dr.DeviceInfo(
            identifiers={(DOMAIN, device_code)},
            name="Kalor Petit",
            manufacturer="Kalor",
            model="Petit",
        )
