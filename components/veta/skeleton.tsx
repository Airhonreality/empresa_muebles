'use client';

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[color:var(--color-skeleton-bg)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonKPI({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-md border bg-bg-raised p-4 flex flex-col gap-1 ${className}`}>
      <Skeleton className="h-4 w-24 text-text-muted" />
      <Skeleton className="h-8 w-32 font-semibold" />
    </div>
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 p-3 border-b ${className}`}>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4 text-text-heading" />
        <Skeleton className="h-4 w-1/2 text-text-muted" />
      </div>
      <Skeleton className="h-4 w-20 shrink-0 text-text-heading" />
    </div>
  );
}
