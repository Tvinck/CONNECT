import { Skeleton } from '@/components/ui/Skeleton'
import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
  return (
    <PageContainer>
      {/* title skeleton */}
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-4 w-56 mb-7" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-5 space-y-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-5">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="ml-auto h-9 w-32 rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-line">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-line last:border-0">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
