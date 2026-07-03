// Hook for managing the stove heating schedule.
// Slots are persisted in localStorage; checkSchedule decides whether the stove
// should currently be on or off.

"use client";

import { useCallback } from "react";
import type { ScheduleSlot, StoveState } from "@/lib/agua-types";
import { useLocalStorage } from "./use-local-storage";

const STORAGE_KEY = "kalor-schedule";

// Generate a unique ID for a slot.
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSchedule() {
  const [slots, setSlots] = useLocalStorage<ScheduleSlot[]>(STORAGE_KEY, []);

  const addSlot = useCallback(
    (slot: Omit<ScheduleSlot, "id">) => {
      setSlots((prev) => [...prev, { ...slot, id: generateId() }]);
    },
    [setSlots],
  );

  const removeSlot = useCallback(
    (id: string) => {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    },
    [setSlots],
  );

  const updateSlot = useCallback(
    (id: string, updates: Partial<Omit<ScheduleSlot, "id">>) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [setSlots],
  );

  const toggleSlot = useCallback(
    (id: string) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      );
    },
    [setSlots],
  );

  // Decide whether the stove should be on/off right now.
  // Returns { shouldBeOn, matchingSlot }.
  const checkSchedule = useCallback(
    (
      stove: StoveState,
    ): {
      shouldBeOn: boolean;
      matchingSlot: ScheduleSlot | null;
    } => {
      const now = new Date();
      // dayOfWeek: 0=Monday, 6=Sunday (matches the type definitions).
      const currentDay = (now.getDay() + 6) % 7;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Find an active slot for the current time.
      const activeSlot = slots.find((slot) => {
        if (!slot.enabled) return false;
        if (slot.dayOfWeek !== currentDay) return false;

        const slotStart = slot.startHour * 60 + slot.startMinute;
        const slotEnd = slot.endHour * 60 + slot.endMinute;

        return currentMinutes >= slotStart && currentMinutes < slotEnd;
      });

      if (activeSlot) {
        return {
          shouldBeOn: true,
          matchingSlot: activeSlot,
        };
      }

      // No active slot — the stove should be off, but only if there is at least
      // one enabled slot for today.
      const hasEnabledSlotsToday = slots.some(
        (s) => s.enabled && s.dayOfWeek === currentDay,
      );

      if (hasEnabledSlotsToday) {
        return {
          shouldBeOn: false,
          matchingSlot: null,
        };
      }

      // No slots for today — do not interfere; keep the current stove state.
      return {
        shouldBeOn: stove.isOn,
        matchingSlot: null,
      };
    },
    [slots],
  );

  return {
    slots,
    addSlot,
    removeSlot,
    updateSlot,
    toggleSlot,
    checkSchedule,
  };
}
