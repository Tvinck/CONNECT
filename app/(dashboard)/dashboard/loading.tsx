import { Skeleton } from '@/components/ui/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
  return (
    <PageContainer>
      {/* title skeleton */}
      <Skeleton className="h-9 w-72 mb-2" />
      <Skeleton className="h-4 w-52 mb-7" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-5 space-y-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>

      {/* Tasks + Activity row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Tasks list */}
        <div className="xl:col-span-2 rounded-2xl border border-line bg-card p-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-line px-4 py-3.5">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-line bg-card p-6 space-y-5">
          <Skeleton className="h-5 w-40 mb-2" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects + Notifications row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Projects progress */}
        <div className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-20" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-10 shrink-0" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-line bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-32 mb-2" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
