import { Skeleton } from '@/components/ui/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
  return (
    <PageContainer>
      {/* title skeleton */}
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-4 w-44 mb-7" />

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Leaderboard rows */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0">
            {/* Rank */}
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            {/* Avatar */}
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            {/* Name + role */}
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            {/* Stats */}
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            {/* Points badge */}
            <Skeleton className="h-7 w-24 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
