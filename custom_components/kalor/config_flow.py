"""Config flow для Kalor — настройка подключения к печи."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DEFAULT_HOST, DEFAULT_PORT, DOMAIN, LOGGER
from .duepi_client import DuepiClient


class KalorConfigFlow(ConfigFlow, domain=DOMAIN):
    """Kalor config flow — host, port, device_code."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Шаг конфигурации: ввод параметров подключения."""
        errors: dict[str, str] = {}

        if user_input is not None:
            device_code = user_input["device_code"]

            # Уникальный ID — device_code (одна печь = одна запись)
            await self.async_set_unique_id(device_code)
            self._abort_if_unique_id_configured()

            # Тест подключения
            client = DuepiClient(
                host=user_input.get("host", DEFAULT_HOST),
                port=user_input.get("port", DEFAULT_PORT),
                device_code=device_code,
            )
            if await client.async_test_connection():
                return self.async_create_entry(
                    title=f"Kalor ({device_code[:6]}...)",
                    data=user_input,
                )

            LOGGER.warning("Не удалось подключиться к печи: %s", device_code)
            errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("device_code"): str,
                    vol.Optional("host", default=DEFAULT_HOST): str,
                    vol.Optional("port", default=DEFAULT_PORT): int,
                }
            ),
            errors=errors,
        )
