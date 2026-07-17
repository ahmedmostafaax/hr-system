interface LoadingPageProps {
  variant?: "table" | "detail" | "card";
  rows?: number;
  message?: string;
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className}`} />;
}

function TableVariant({ rows }: { rows: number }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-10 w-32" />
      </div>
      <SkeletonBar className="h-10 w-full max-w-sm" />
      <div className="rounded-lg border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBar key={i} className="h-4 w-20" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="px-6 py-4 flex gap-6 border-t border-slate-50">
            {Array.from({ length: 4 }).map((__, ci) => (
              <SkeletonBar key={ci} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailVariant() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <SkeletonBar className="h-4 w-64" />
      <SkeletonBar className="h-10 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardVariant() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-5 space-y-3">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function LoadingPage({
  variant = "table",
  rows = 6,
  message,
}: LoadingPageProps) {
  return (
    <div className="w-full min-h-[400px]">
      {variant === "table" && <TableVariant rows={rows} />}
      {variant === "detail" && <DetailVariant />}
      {variant === "card" && <CardVariant />}
      {message && (
        <p className="text-center text-sm text-slate-400 font-medium pb-6 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
