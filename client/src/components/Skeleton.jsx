export function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-5 rounded-2xl border border-slate-200 bg-white animate-pulse ${className}`}>
      <div className="h-3 w-16 bg-slate-200 rounded" />
      <div className="mt-3 h-5 w-32 bg-slate-200 rounded" />
      <div className="mt-2 h-3 w-48 bg-slate-100 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-48 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export function SkeletonPage({ cards = 3, rows = 0 }) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
      <div className="mt-1 h-4 w-64 bg-slate-100 rounded animate-pulse" />
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {rows > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
