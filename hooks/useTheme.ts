"use client";

import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants";

export type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }

  return "dark";
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [hasHydrated, setHasHydrated] = useState(false);
  const resolvedTheme = useMemo<ResolvedTheme>(
    () => (preference === "system" ? getSystemTheme() : preference),
    [preference]
  );

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(STORAGE_KEYS.theme) as
      | ThemePreference
      | null;

    if (
      storedPreference === "light" ||
      storedPreference === "dark" ||
      storedPreference === "system"
    ) {
      setPreference(storedPreference);
      applyTheme(storedPreference === "system" ? getSystemTheme() : storedPreference);
    } else {
      applyTheme(getSystemTheme());
    }

    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.theme, preference);
    applyTheme(resolvedTheme);
  }, [hasHydrated, preference, resolvedTheme]);

  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => applyTheme(getSystemTheme());

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  return {
    preference,
    resolvedTheme,
    setPreference,
    hasHydrated
  };
}
