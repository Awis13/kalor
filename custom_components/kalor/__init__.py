"""Интеграция Kalor для Home Assistant."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant

from .const import DEFAULT_HOST, DEFAULT_PORT
from .coordinator import KalorConfigEntry, KalorCoordinator
from .duepi_client import DuepiClient

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.CLIMATE,
    Platform.NUMBER,
    Platform.SENSOR,
]


async def async_setup_entry(hass: HomeAssistant, entry: KalorConfigEntry) -> bool:
    """Настройка Kalor из config entry."""
    client = DuepiClient(
        host=entry.data.get("host", DEFAULT_HOST),
        port=entry.data.get("port", DEFAULT_PORT),
        device_code=entry.data["device_code"],
    )

    coordinator = KalorCoordinator(hass, entry, client)
    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: KalorConfigEntry) -> bool:
    """Выгрузка Kalor."""
    result = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if result:
        await entry.runtime_data.client.disconnect()
    return result
