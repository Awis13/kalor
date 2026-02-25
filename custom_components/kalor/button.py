"""Button entity: сброс ошибки Kalor."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .coordinator import KalorConfigEntry, KalorCoordinator
from .duepi_client import DuepiCommandError, DuepiConnectionError
from .entity import KalorEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: KalorConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Создание button entity."""
    async_add_entities([KalorResetErrorButton(entry.runtime_data)])


class KalorResetErrorButton(KalorEntity, ButtonEntity):
    """Кнопка сброса ошибки печи."""

    _attr_translation_key = "reset_error"

    def __init__(self, coordinator: KalorCoordinator) -> None:
        """Инициализация button entity."""
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.unique_id}-reset_error"

    async def async_press(self) -> None:
        """Сбросить ошибку."""
        try:
            await self.coordinator.client.async_reset_error()
        except (DuepiConnectionError, DuepiCommandError) as err:
            raise HomeAssistantError(f"Ошибка сброса аларма: {err}") from err
        await self.coordinator.async_request_refresh()
