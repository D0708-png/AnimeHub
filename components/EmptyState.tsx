import Link from "next/link";
import { Search } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  actionHref = "/search",
  actionLabel = "Browse catalog"
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.06] p-8 text-center shadow-soft backdrop-blur-xl">
      <Search className="mx-auto h-8 w-8 text-aqua" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/62">{description}</p>
      <Link
        href={actionHref}
        className="button-primary mt-5"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
