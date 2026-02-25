"""Координатор обновлений Kalor — поллинг печи каждые 12 секунд."""

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
    """Координатор: поллинг печи через DuepiClient."""

    config_entry: KalorConfigEntry
    client: DuepiClient

    def __init__(
        self,
        hass: HomeAssistant,
        config_entry: KalorConfigEntry,
        client: DuepiClient,
    ) -> None:
        """Инициализация координатора."""
        super().__init__(
            hass,
            LOGGER,
            config_entry=config_entry,
            name=DOMAIN,
            update_interval=SCAN_INTERVAL,
        )
        self.client = client

    async def _async_setup(self) -> None:
        """Первое подключение при инициализации."""
        try:
            await self.client.connect()
        except DuepiConnectionError as err:
            raise UpdateFailed(f"Ошибка подключения: {err}") from err

    async def _async_update_data(self) -> StoveData:
        """Поллинг всех регистров печи."""
        try:
            return await self.client.async_get_stove_data()
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise UpdateFailed(f"Ошибка обновления данных: {err}") from err
