// Hook for working with the stove
// Automatically starts/stops polling on mount/unmount
// Merges optimistic state over the real state for instant UI reaction

"use client";

import { useEffect, useMemo } from "react";
import { useStoveStore } from "@/store/stove-store";

export function useStove() {
  const stove = useStoveStore((s) => s.stove);
  const isLoading = useStoveStore((s) => s.isLoading);
  const error = useStoveStore((s) => s.error);
  const isPolling = useStoveStore((s) => s.isPolling);
  const sendCommand = useStoveStore((s) => s.sendCommand);
  const startPolling = useStoveStore((s) => s.startPolling);
  const stopPolling = useStoveStore((s) => s.stopPolling);
  const pendingCommand = useStoveStore((s) => s.pendingCommand);
  const optimistic = useStoveStore((s) => s.optimistic);

  useEffect(() => {
    startPolling();
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Merge optimistic over the real data
  const mergedStove = useMemo(() => {
    if (!stove) return null;
    return {
      ...stove,
      ...(optimistic.isOn !== undefined && { isOn: optimistic.isOn }),
      ...(optimistic.powerLevel !== undefined && { powerLevel: optimistic.powerLevel }),
      ...(optimistic.targetTemp !== undefined && { targetTemp: optimistic.targetTemp }),
    };
  }, [stove, optimistic]);

  return {
    stove: mergedStove,
    isLoading,
    error,
    sendCommand,
    isPolling,
    isSending: pendingCommand !== null,
    pendingCommand,
  };
}
