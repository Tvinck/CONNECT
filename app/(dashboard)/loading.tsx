/**
 * app/(dashboard)/loading.tsx — Skeleton placeholder for dashboard pages.
 *
 * Next.js automatically renders this file while a Server Component segment
 * is streaming/suspending. It shows a shimmer skeleton that matches the
 * approximate layout of the dashboard page, reducing layout shift.
 */

/** Single pulsing shimmer block. */
function Bone({ className }: { className?: string }) {
  return <div className={`bg-white/[0.05] rounded-xl animate-pulse ${className ?? ''}`} />
}

export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto">

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-7 gap-4">
        <div className="space-y-2">
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-3">
          <Bone className="hidden md:block h-10 w-52" />
          <Bone className="h-10 w-10" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 space-y-4">
            <Bone className="h-10 w-10 rounded-xl" />
            <Bone className="h-3 w-24" />
            <Bone className="h-9 w-28" />
          </div>
        ))}
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="xl:col-span-2 card p-6 space-y-3">
          <Bone className="h-5 w-40 mb-2" />
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="card p-6 space-y-3">
          <Bone className="h-5 w-40 mb-2" />
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card p-6 space-y-4">
          <Bone className="h-5 w-40" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-3 w-3/4" />
                <Bone className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-3">
          <Bone className="h-5 w-40" />
          {[...Array(3)].map((_, i) => (
            <Bone key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

    </div>
  )
}
