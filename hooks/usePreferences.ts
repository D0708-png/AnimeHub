"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { defaultPreferences } from "@/lib/storage";
import type { UserPreferences } from "@/types/storage";
import { useLocalStorage } from "./useLocalStorage";

export function usePreferences() {
  const [preferences, setPreferences, hasHydrated] = useLocalStorage<UserPreferences>(
    STORAGE_KEYS.preferences,
    defaultPreferences
  );

  return {
    preferences,
    setPreferences,
    hasHydrated
  };
}
