export default function Loading() {
  return (
    <div className="container-page space-y-6 py-10">
      <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="glass-card overflow-hidden">
            <div className="aspect-[3/4] animate-pulse bg-white/10" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
