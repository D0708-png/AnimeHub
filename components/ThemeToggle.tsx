"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { type ThemePreference, useTheme } from "@/hooks/useTheme";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor }
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full border border-token bg-token-card p-1 shadow-sm",
        compact && "scale-95"
      )}
      aria-label="Theme"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={clsx(
              "inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-xs font-black transition",
              active
                ? "bg-token-primary text-token-primary-foreground shadow-sm"
                : "text-token-muted hover:bg-token-muted hover:text-token-foreground"
            )}
            aria-pressed={active}
            aria-label={`Use ${option.label} theme`}
            title={option.label}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className={compact ? "sr-only" : "hidden xl:inline"}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
