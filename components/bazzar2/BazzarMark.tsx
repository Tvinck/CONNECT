// Кастом-логознак BazzarSerts 2.0 — градиентный бейдж с галочкой
// (тема «проверенный сертификат»). Без эмодзи, масштабируемый SVG.
export function BazzarMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="bzm-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFF128" />
          <stop offset="1" stopColor="#1472F5" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="url(#bzm-grad)" />
      <path d="M9.5 16.8l4.2 4.2L22.8 11" stroke="#0B1220" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
