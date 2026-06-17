export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="glass-card space-y-4 p-8">
        <div className="h-7 w-48 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-full bg-white/10" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
