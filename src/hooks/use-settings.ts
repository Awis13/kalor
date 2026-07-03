// Hooks for user preferences (localStorage): theme and custom stove name.

"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

const THEME_KEY = "kalor-theme";
const NAME_KEY = "kalor-name";
const DEFAULT_NAME = "Kalor";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setStored] = useLocalStorage<Theme>(THEME_KEY, "dark");

  // Sync the document class with the current theme (DOM side effect only).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setStored(t), [setStored]);

  const toggle = useCallback(
    () => setStored((prev) => (prev === "dark" ? "light" : "dark")),
    [setStored],
  );

  return { theme, setTheme, toggle };
}

export function useStoveName() {
  const [name, setStored, removeStored] = useLocalStorage<string>(
    NAME_KEY,
    DEFAULT_NAME,
  );

  const setName = useCallback(
    (n: string) => {
      const trimmed = n.trim() || DEFAULT_NAME;
      if (trimmed === DEFAULT_NAME) {
        removeStored();
      } else {
        setStored(trimmed);
      }
    },
    [setStored, removeStored],
  );

  return { name, setName };
}
