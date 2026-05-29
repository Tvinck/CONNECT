export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-7 max-w-[1400px] mx-auto">
      {children}
    </main>
  )
}
