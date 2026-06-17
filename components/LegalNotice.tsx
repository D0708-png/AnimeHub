import { ShieldCheck } from "lucide-react";
import { LEGAL_DISCLAIMER } from "@/lib/constants";

interface LegalNoticeProps {
  compact?: boolean;
}

export function LegalNotice({ compact = false }: LegalNoticeProps) {
  return (
    <aside
      className={
        compact
          ? "rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/66 backdrop-blur-xl"
          : "rounded-3xl border border-white/10 bg-white/[0.07] p-5 text-sm text-white/70 shadow-soft backdrop-blur-xl"
      }
    >
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-aqua" aria-hidden="true" />
        <p>{LEGAL_DISCLAIMER}</p>
      </div>
    </aside>
  );
}
