export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12" aria-busy>
      <div className="h-8 w-44 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="h-14 w-24 animate-pulse rounded-lg bg-white/5" />
            <div className="flex-1">
              <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-white/5" />
            </div>
            <div className="h-8 w-14 animate-pulse rounded-lg bg-white/5" />
          </div>
        ))}
      </div>
    </main>
  );
}
