import type { Config } from 'tailwindcss'

const config: Config = { darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        card:    'var(--color-card)',
        'card-hover': 'var(--color-card-hover)',
        sidebar: 'var(--color-sidebar)',
        line:    'var(--color-line)',
        line2:   'var(--color-line2)',
        accent:  '#1472F5',
        brand:   '#BFF128',
        'brand-hover': '#C9F735',
        cyan:    '#00C2FF',
        ok:      '#22C55E',
        warn:    '#F59E0B',
        err:     '#EF4444',
        gold:    '#FFC833',
        purple:  '#6F4FE8',
        mute:    'var(--color-mute)',
        mute2:   'var(--color-mute2)',
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Canonical radius scale (single source of truth). Values match the
      // radii already in use so this is visually a no-op; edit here to
      // retune the whole app at once. Usage guide:
      //   lg   (8px)  — small controls, chips, tiny badges
      //   xl   (12px) — inputs, buttons, list rows
      //   2xl  (16px) — inner cards, nested surfaces
      //   card (24px) — panels, cards, modals
      //   full        — pills, avatars, dots
      borderRadius: {
        lg:    '8px',
        xl:    '12px',
        '2xl': '16px',
        card:  '24px',
      },
      boxShadow: {
        glow:      '0 0 24px -4px rgba(20,114,245,0.45)',
        'glow-sm': '0 0 12px -2px rgba(20,114,245,0.35)',
        'glow-gold': '0 0 24px -6px rgba(255,200,51,0.5)',
        // Brand (lime) glows — for primary actions / active states.
        'glow-lime':    '0 0 24px -4px rgba(191,241,40,0.45)',
        'glow-lime-sm': '0 0 12px -2px rgba(191,241,40,0.35)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'proj-podari': 'linear-gradient(135deg, #1472F5 0%, #0B4FB8 100%)',
        'proj-pixel':  'linear-gradient(135deg, #FF4D9D 0%, #00C2FF 100%)',
        'proj-market': 'linear-gradient(135deg, #22C55E 0%, #0E8043 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'shimmer':   'shimmer 2.5s linear infinite',
        'rise':      'rise 600ms cubic-bezier(0.2,0.7,0.2,1) both',
        'pulse-dot': 'pulse-dot 1.8s ease-out infinite',
        'pop-in':    'popIn 200ms cubic-bezier(0.2,0.7,0.2,1) both',
        'modal-in':  'modalIn 220ms cubic-bezier(0.2,0.8,0.25,1) both',
        'toast-in':  'toastIn 260ms cubic-bezier(0.2,0.8,0.25,1) both',
        'fill-in':   'fillin 900ms cubic-bezier(0.25,0.85,0.3,1) both',
        'fade-in':   'fadeIn 180ms ease-out both',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.6)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(34,197,94,0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fillin: {
          from: { transform: 'scaleX(0)' },
          to:   { transform: 'scaleX(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
