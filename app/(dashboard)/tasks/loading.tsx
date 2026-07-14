import { Skeleton } from '@/components/ui/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
  return (
    <PageContainer>
      {/* title skeleton */}
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-7" />

      {/* 4-column kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, col) => (
          <div key={col} className="flex flex-col gap-3">
            {/* Column header */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {/* Task cards */}
            {[...Array(col === 0 ? 4 : col === 1 ? 3 : col === 2 ? 2 : 1)].map((_, i) => (
              <div key={i} className="rounded-xl border border-line bg-card p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
