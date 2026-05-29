/**
 * PageContainer — uniform page-level wrapper.
 *
 * Centres content, applies horizontal padding that grows with the viewport,
 * and plays the rise entrance animation defined in globals.css (.page-enter).
 * The element is a `<div>` (not `<main>`) because the dashboard layout already
 * renders a `<main>` — nesting two `<main>` elements is invalid HTML.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto">
      {children}
    </div>
  )
}
