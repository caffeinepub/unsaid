import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-5 w-16 rounded bg-[oklch(0.22_0.01_285)]" />
        <Skeleton className="h-4 w-12 rounded bg-[oklch(0.22_0.01_285)]" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-1.5 rounded bg-[oklch(0.22_0.01_285)]" />
      <Skeleton className="h-4 w-full mb-1 rounded bg-[oklch(0.2_0.01_285)]" />
      <Skeleton className="h-4 w-2/3 mb-3 rounded bg-[oklch(0.2_0.01_285)]" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-12 rounded bg-[oklch(0.2_0.01_285)]" />
        <Skeleton className="h-6 w-10 rounded bg-[oklch(0.2_0.01_285)]" />
      </div>
    </div>
  );
}

const SKELETON_IDS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

export function PostSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" data-ocid="home.loading_state">
      {SKELETON_IDS.slice(0, count).map((id) => (
        <PostSkeleton key={`sk-${id}`} />
      ))}
    </div>
  );
}
