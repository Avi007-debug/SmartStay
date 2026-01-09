import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PGCardSkeleton = () => (
  <Card className="overflow-hidden border-2">
    <div className="flex flex-col md:flex-row">
      <Skeleton className="md:w-72 h-48 md:h-auto shrink-0" />
      <div className="flex-1 p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  </Card>
);

export const PGDetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-96 w-full rounded-xl" />
    <div className="space-y-3">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <Skeleton className="h-px w-full" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  </div>
);

export const ReviewSkeleton = () => (
  <div className="space-y-3 p-4 border rounded-lg">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </div>
);
