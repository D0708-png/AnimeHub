"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";

export function PreferencesPanel() {
  const { preferences, setPreferences } = usePreferences();

  return (
    <section className="glass-card p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-aqua" aria-hidden="true" />
        <h2 className="text-lg font-black text-white">Local preferences</h2>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="rounded-2xl border border-token bg-token-card p-3 text-sm font-bold text-token-muted">
          <input
            type="checkbox"
            className="mr-2"
            checked={preferences.compactCards}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                compactCards: event.target.checked
              })
            }
          />
          Compact cards
        </label>
        <label className="rounded-2xl border border-token bg-token-card p-3 text-sm font-bold text-token-muted">
          <input
            type="checkbox"
            className="mr-2"
            checked={preferences.reducedMotion}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                reducedMotion: event.target.checked
              })
            }
          />
          Reduce motion
        </label>
        <label className="rounded-2xl border border-token bg-token-card p-3 text-sm font-bold text-token-muted">
          Subtitle
          <select
            value={preferences.preferredSubtitleLanguage}
            onChange={(event) =>
              setPreferences({
                ...preferences,
                preferredSubtitleLanguage: event.target.value
              })
            }
            className="form-field mt-2 h-9 rounded-xl px-2 py-1 text-sm"
          >
            <option>Official default</option>
            <option>Bahasa Indonesia</option>
            <option>English</option>
          </select>
        </label>
      </div>
    </section>
  );
}
