import type { UserPreferences } from "@/types/storage";

export const defaultPreferences: UserPreferences = {
  compactCards: false,
  preferredSubtitleLanguage: "Official default",
  reducedMotion: false
};

export function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatStoredDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
