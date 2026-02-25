// Zustand стор для управления состоянием печи
// Поллинг /api/stove/status, отправка команд через /api/stove/command

import { create } from "zustand";
import type { StoveState } from "@/lib/agua-types";
import { POLL_INTERVAL } from "@/lib/agua-constants";

interface StoveStore {
  stove: StoveState | null;
  isLoading: boolean;
  error: string | null;
  isPolling: boolean;
  pollInterval: number;

  // Какая команда сейчас в полёте (null = ничего)
  pendingCommand: string | null;
  // Optimistic значения — показываем сразу, до ответа сервера
  optimistic: {
    isOn?: boolean;
    powerLevel?: number;
    targetTemp?: number;
  };
  fetchStatus: () => Promise<void>;
  sendCommand: (command: string, value?: number) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  setPollInterval: (ms: number) => void;
}

let pollTimerId: ReturnType<typeof setInterval> | null = null;

export const useStoveStore = create<StoveStore>((set, get) => ({
  stove: null,
  isLoading: false,
  error: null,
  isPolling: false,
  pollInterval: POLL_INTERVAL,
  pendingCommand: null,
  optimistic: {},

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/stove/status");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const stove: StoveState = await res.json();
      // Сбрасываем optimistic только если нет команды в полёте
      const updates: Partial<StoveStore> = { stove, error: null };
      if (!get().pendingCommand) {
        updates.optimistic = {};
      }
      set(updates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch status";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  sendCommand: async (command: string, value?: number) => {
    // Optimistic update — моментальная реакция UI
    const opt: StoveStore["optimistic"] = {};
    if (command === "power_on") opt.isOn = true;
    if (command === "power_off") opt.isOn = false;
    if (command === "set_power" && value !== undefined) opt.powerLevel = value;
    if (command === "set_temp" && value !== undefined) opt.targetTemp = value;

    set({ pendingCommand: command, optimistic: opt });

    try {
      const res = await fetch("/api/stove/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Обновляем статус с сервера
      await get().fetchStatus();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send command";
      set({ error: message, optimistic: {} });
    } finally {
      set({ pendingCommand: null });
    }
  },

  startPolling: () => {
    const state = get();
    if (state.isPolling) return;

    state.fetchStatus();

    pollTimerId = setInterval(() => {
      get().fetchStatus();
    }, state.pollInterval);

    set({ isPolling: true });
  },

  stopPolling: () => {
    if (pollTimerId) {
      clearInterval(pollTimerId);
      pollTimerId = null;
    }
    set({ isPolling: false });
  },

  setPollInterval: (ms: number) => {
    const state = get();
    set({ pollInterval: ms });

    if (state.isPolling) {
      state.stopPolling();
      setTimeout(() => get().startPolling(), 0);
    }
  },

}));
