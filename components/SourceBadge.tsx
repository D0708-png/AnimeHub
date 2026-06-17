import { ShieldCheck } from "lucide-react";
import { cleanSourceName } from "@/lib/catalog";

interface SourceBadgeProps {
  sourceName: string;
  compact?: boolean;
}

export function SourceBadge({ sourceName, compact = false }: SourceBadgeProps) {
  const label = cleanSourceName(sourceName);

  return (
    <span
      className={
        compact
          ? "inline-flex items-center gap-1 rounded-full border border-cyan/20 bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan"
          : "inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-xs font-bold text-cyan"
      }
    >
      <ShieldCheck className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      Source: {label}
    </span>
  );
}
