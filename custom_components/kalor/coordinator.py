"""Kalor update coordinator — polls the stove every 12 seconds."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

from .const import DOMAIN, LOGGER, SCAN_INTERVAL
from .duepi_client import DuepiClient, DuepiCommandError, DuepiConnectionError, StoveData

type KalorConfigEntry = ConfigEntry[KalorCoordinator]


class KalorCoordinator(DataUpdateCoordinator[StoveData]):
    """Coordinator: polls the stove via DuepiClient."""

    config_entry: KalorConfigEntry
    client: DuepiClient

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: KalorConfigEntry,
        client: DuepiClient,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            LOGGER,
            config_entry=config_entry,
            name=DOMAIN,
            update_interval=SCAN_INTERVAL,
        )
        self.client = client

    async def _async_setup(self) -> None:
        """Establish the first connection during initialization."""
        try:
            await self.client.connect()
        except DuepiConnectionError as err:
            raise UpdateFailed(f"Connection error: {err}") from err

    async def _async_update_data(self) -> StoveData:
        """Poll all stove registers."""
        try:
            return await self.client.async_get_stove_data()
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise UpdateFailed(f"Data update error: {err}") from err
