interface LogomarkProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Logomark({ size = 'md' }: LogomarkProps) {
  const big = size === 'lg'
  const iconSize = big ? 36 : 28

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative" style={{ width: iconSize, height: iconSize }}>
        <svg viewBox="0 0 36 36" width={iconSize} height={iconSize}>
          <defs>
            <linearGradient id="lm-g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#1472F5" />
              <stop offset="100%" stopColor="#00C2FF" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="34" height="34" rx="9" fill="url(#lm-g)" />
          <path
            d="M11 22a6 6 0 0 1 0-8 6 6 0 0 1 7-1.2M17 14a6 6 0 0 1 8 8 6 6 0 0 1-7 1.2"
            stroke="white"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="1.6" fill="white" />
        </svg>
      </div>
      <div className="leading-none">
        <div className={`font-bold tracking-tight ${big ? 'text-[22px]' : 'text-[17px]'}`}>
          CONNECT
        </div>
        {big && (
          <div className="text-[10.5px] text-mute mt-1 tracking-[0.16em] uppercase">
            BAZZAR Group
          </div>
        )}
      </div>
    </div>
  )
}
