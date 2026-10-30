import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

function SkeletonText({ lines = 1, className }) {
  const widths = ["100%", "80%", "60%", "90%", "70%"];

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-32" />
      <SkeletonText lines={2} />
    </div>
  );
}

function SkeletonStat({ className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 space-y-3", className)}>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function SkeletonTableRow({ columns = 5 }) {
  const widths = ["w-24", "w-16", "w-20", "w-14", "w-18"];

  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className={cn("h-4", widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonStat, SkeletonTableRow };
