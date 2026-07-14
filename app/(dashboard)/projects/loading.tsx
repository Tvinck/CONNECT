import { Skeleton } from '@/components/ui/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
  return (
    <PageContainer>
      {/* title skeleton */}
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-7" />

      {/* Filter / action row */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-7 w-7 rounded-full border-2 border-card" />
                ))}
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
