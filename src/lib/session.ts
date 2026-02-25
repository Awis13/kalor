// Серверный синглтон Duepi клиента
// Один экземпляр на процесс Next.js — переиспользует TCP соединение

import { DuepiClient } from "./duepi-client";

const globalForDuepi = globalThis as typeof globalThis & {
  duepiClient?: DuepiClient;
};

export function getDuepiClient(): DuepiClient {
  if (!globalForDuepi.duepiClient) {
    const deviceCode = process.env.DUEPI_DEVICE_CODE;
    if (!deviceCode) {
      throw new Error(
        "DUEPI_DEVICE_CODE is not set. Add it to .env.local"
      );
    }

    globalForDuepi.duepiClient = new DuepiClient({
      host: process.env.DUEPI_HOST || "duepiwebserver2.com",
      port: Number(process.env.DUEPI_PORT) || 3000,
      deviceCode,
    });
  }
  return globalForDuepi.duepiClient;
}
