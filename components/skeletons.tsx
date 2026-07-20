function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-card ${className}`} />;
}

export function PortfolioSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-28" aria-busy>
      <Bone className="h-9 w-64" />
      <Bone className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-14 grid items-center gap-6 sm:grid-cols-[7fr_1.2fr_5fr] sm:gap-0">
        <div className="rounded-2xl border border-card-border bg-card p-3">
          <Bone className="aspect-[16/10] w-full rounded-xl" />
          <div className="p-5">
            <Bone className="h-5 w-40" />
            <Bone className="mt-3 h-3.5 w-full" />
            <Bone className="mt-2 h-3.5 w-2/3" />
            <div className="mt-4 flex gap-2">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="hidden sm:block" />
        <PortfolioRowSkeletonExtra />
      </div>
    </section>
  );
}

export function PortfolioRowSkeletonExtra() {
  return (
    <div className="hidden flex-col gap-5 sm:flex">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-card-border bg-card p-5"
        >
          <Bone className="h-3.5 w-20" />
          <Bone className="mt-3 h-3.5 w-full" />
          <Bone className="mt-2 h-3.5 w-4/5" />
          <Bone className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
