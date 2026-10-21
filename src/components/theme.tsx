"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

const SYSTEM_DARK = "(prefers-color-scheme: dark)";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return matchMedia(SYSTEM_DARK).matches ? "dark" : "light";
}

/** Fija el tema elegido a mano y lo recuerda. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento (modo privado): se aplica solo a esta visita.
  }
  applyTheme(theme);
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Tema aplicado ahora mismo. En el servidor (y al hidratar) vale "light". */
export function useResolvedTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light" as const);
}

/**
 * Sigue los cambios del sistema mientras no haya preferencia guardada y
 * sincroniza el tema entre pestañas.
 */
export function ThemeSync() {
  useEffect(() => {
    const media = matchMedia(SYSTEM_DARK);
    const onSystemChange = () => {
      if (!storedTheme()) applyTheme(systemTheme());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) applyTheme(storedTheme() ?? systemTheme());
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}
