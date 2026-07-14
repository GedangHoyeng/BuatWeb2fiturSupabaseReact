import { useTheme } from '../../contexts/ThemeContext';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-muted/60 shimmer ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl glass-card space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
      {[1, 2, 3, 4].map((col) => (
        <div key={col} className="flex flex-col gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40">
          <div className="flex justify-between items-center pb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          {[1, 2, 3].map((card) => (
            <div key={card} className="p-4 rounded-xl glass-card space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 rounded-full" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 border-b border-border/40">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-1/6" />
        <Skeleton className="h-4 w-12" />
      </div>
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex items-center justify-between p-4 rounded-xl border border-border/40 glass-card">
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <div className="flex items-center gap-6 w-1/2 justify-end">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
