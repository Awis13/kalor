// Хук для управления расписанием печи
// Хранит слоты в localStorage, проверяет необходимость включения/выключения

"use client";

import { useState, useCallback, useEffect } from "react";
import type { ScheduleSlot, StoveState } from "@/lib/agua-types";

const STORAGE_KEY = "kalor-schedule";

// Чтение из localStorage
function loadSlots(): ScheduleSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Запись в localStorage
function saveSlots(slots: ScheduleSlot[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

// Генерация уникального ID для слота
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSchedule() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);

  // Загрузка при монтировании
  useEffect(() => {
    setSlots(loadSlots());
  }, []);

  // Синхронизация с localStorage при каждом изменении
  useEffect(() => {
    // Пропускаем первый рендер (пустой массив до загрузки)
    if (typeof window === "undefined") return;
    saveSlots(slots);
  }, [slots]);

  const addSlot = useCallback((slot: Omit<ScheduleSlot, "id">) => {
    setSlots((prev) => [...prev, { ...slot, id: generateId() }]);
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSlot = useCallback(
    (id: string, updates: Partial<Omit<ScheduleSlot, "id">>) => {
      setSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const toggleSlot = useCallback((id: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  // Проверка: нужно ли сейчас включить/выключить печь
  // Возвращает { shouldBeOn, matchingSlot } или null если расписание не активно
  const checkSchedule = useCallback(
    (
      stove: StoveState
    ): {
      shouldBeOn: boolean;
      matchingSlot: ScheduleSlot | null;
    } => {
      const now = new Date();
      // dayOfWeek: 0=пн, 6=вс (как в типах)
      const currentDay = (now.getDay() + 6) % 7;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Ищем активный слот для текущего времени
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

      // Нет активного слота — печь должна быть выключена (если управляется расписанием)
      // Но только если есть хоть один enabled слот на сегодня
      const hasEnabledSlotsToday = slots.some(
        (s) => s.enabled && s.dayOfWeek === currentDay
      );

      if (hasEnabledSlotsToday) {
        return {
          shouldBeOn: false,
          matchingSlot: null,
        };
      }

      // Нет слотов на сегодня — не вмешиваемся
      // Возвращаем текущее состояние печи как "желаемое"
      return {
        shouldBeOn: stove.isOn,
        matchingSlot: null,
      };
    },
    [slots]
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
