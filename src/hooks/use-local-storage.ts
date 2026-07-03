// localStorage-backed state via useSyncExternalStore.
// Reads on the client after hydration (server snapshot = the initial value),
// so there is no hydration mismatch and no setState-in-effect.

"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

type Listener = () => void;

const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

// Notify same-tab subscribers (the native "storage" event only fires in other tabs).
function notify(): void {
  for (const listener of listeners) listener();
}

// Parsed-value cache keyed by storage key, so getSnapshot returns a stable
// reference while the raw string is unchanged (useSyncExternalStore compares
// snapshots with Object.is — returning a fresh object every call would loop).
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, initial: T): T {
  const raw = localStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    value = raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    value = initial;
  }
  cache.set(key, { raw, value });
  return value;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const initialRef = useRef(initial);

  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initialRef.current),
    () => initialRef.current,
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = read(key, initialRef.current);
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(current)
          : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      notify();
    },
    [key],
  );

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    notify();
  }, [key]);

  return [value, setValue, remove] as const;
}
