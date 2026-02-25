// Хук для записи и чтения истории температуры из IndexedDB
// Записывает показания каждый poll tick, читает по диапазону

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useStoveStore } from "@/store/stove-store";
import { addReading, getReadings, clearOldReadings } from "@/db/history-db";
import type { HistoryEntry } from "@/lib/agua-types";

type HistoryRange = "1H" | "24H" | "7D" | "30D";

// Маппинг диапазонов в миллисекунды
const RANGE_MS: Record<HistoryRange, number> = {
  "1H": 60 * 60 * 1000,
  "24H": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
};

// Максимальный возраст записей — 31 день
const MAX_AGE_MS = 31 * 24 * 60 * 60 * 1000;

export function useStoveHistory() {
  const stove = useStoveStore((s) => s.stove);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [range, setRange] = useState<HistoryRange>("1H");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const lastRecordedRef = useRef<number>(0);

  // Записываем показания при каждом обновлении stove
  useEffect(() => {
    if (!stove) return;

    // Не записываем чаще чем раз в 5 секунд (защита от дублей)
    const now = Date.now();
    if (now - lastRecordedRef.current < 5000) return;
    lastRecordedRef.current = now;

    const entry: HistoryEntry = {
      timestamp: stove.lastUpdate,
      roomTemp: stove.roomTemp,
      targetTemp: stove.targetTemp,
      fumesTemp: stove.fumesTemp,
      waterTemp: stove.waterTemp,
      powerLevel: stove.powerLevel,
      fanSpeed: stove.fanSpeed,
      status: stove.status,
      flamePower: stove.flamePower,
    };

    addReading(entry).catch((err) =>
      console.error("Failed to record history:", err)
    );
  }, [stove]);

  // Периодическая очистка старых записей (раз в час)
  useEffect(() => {
    const cleanup = () => {
      const cutoff = Date.now() - MAX_AGE_MS;
      clearOldReadings(cutoff).catch((err) =>
        console.error("Failed to clear old readings:", err)
      );
    };

    // Очистка при монтировании
    cleanup();

    const interval = setInterval(cleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Загрузить историю по выбранному диапазону
  const getHistory = useCallback(
    async (selectedRange: HistoryRange): Promise<HistoryEntry[]> => {
      setIsLoadingHistory(true);
      try {
        const now = Date.now();
        const from = now - RANGE_MS[selectedRange];
        const entries = await getReadings(from, now);
        setHistory(entries);
        setRange(selectedRange);
        return entries;
      } catch (err) {
        console.error("Failed to get history:", err);
        return [];
      } finally {
        setIsLoadingHistory(false);
      }
    },
    []
  );

  // Загружаем историю при смене диапазона + авто-рефреш каждые 15 сек
  useEffect(() => {
    getHistory(range);
    const interval = setInterval(() => getHistory(range), 15_000);
    return () => clearInterval(interval);
  }, [range, getHistory]);

  return {
    history,
    range,
    setRange,
    getHistory,
    isLoadingHistory,
  };
}
