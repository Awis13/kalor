// Хук для пользовательских настроек (localStorage)
// Тема, кастомное имя печки

"use client";

import { useEffect, useState, useCallback } from "react";

const THEME_KEY = "kalor-theme";
const NAME_KEY = "kalor-name";
const DEFAULT_NAME = "Kalor";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    const initial = stored || "dark";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}

export function useStoveName() {
  const [name, setNameState] = useState(DEFAULT_NAME);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) setNameState(stored);
  }, []);

  const setName = useCallback((n: string) => {
    const trimmed = n.trim() || DEFAULT_NAME;
    setNameState(trimmed);
    if (trimmed === DEFAULT_NAME) {
      localStorage.removeItem(NAME_KEY);
    } else {
      localStorage.setItem(NAME_KEY, trimmed);
    }
  }, []);

  return { name, setName };
}
