/** Design tokens. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#071226', 900: '#0f1d3a', 700: '#3b4a68', 500: '#66748f', 300: '#c3cde0', 100: '#e6ecf6' },
        // `brand` is driven by CSS variables (see styles/index.css) so the booking pages can switch to the indigo palette.
        brand: Object.fromEntries([50, 100, 200, 400, 500, 600, 700, 900].map((n) => [n, `rgb(var(--brand-${n}) / <alpha-value>)`])),
        aqua: { 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        coral: { 100: '#ffe5e8', 400: '#ff6b81', 500: '#e5354f' },
        sand: { 50: '#f4f8ff', 100: '#e8f0fd' },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(7,18,38,.05), 0 8px 24px -12px rgba(7,18,38,.16)',
        lift: '0 2px 4px rgba(7,18,38,.06), 0 20px 40px -16px rgb(var(--brand-600) / .45)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'aurora-a': { '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' }, '50%': { transform: 'translate3d(8%,10%,0) scale(1.12)' } },
        'aurora-b': { '0%,100%': { transform: 'translate3d(0,0,0) scale(1.05)' }, '50%': { transform: 'translate3d(-10%,-8%,0) scale(.94)' } },
        'aurora-c': { '0%,100%': { transform: 'translate3d(0,0,0) scale(.95)' }, '50%': { transform: 'translate3d(12%,-6%,0) scale(1.1)' } },
        'drift-a': { '0%,100%': { transform: 'translate3d(0,0,0) rotate(0deg)' }, '50%': { transform: 'translate3d(18px,-26px,0) rotate(14deg)' } },
        'drift-b': { '0%,100%': { transform: 'translate3d(0,0,0) rotate(0deg)' }, '50%': { transform: 'translate3d(-22px,20px,0) rotate(-12deg)' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'grid-flow': { to: { backgroundPosition: '0 48px' } },
        sheen: { '0%': { transform: 'translateX(-120%) skewX(-18deg)' }, '60%,100%': { transform: 'translateX(260%) skewX(-18deg)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'aurora-a': 'aurora-a 22s ease-in-out infinite',
        'aurora-b': 'aurora-b 28s ease-in-out infinite',
        'aurora-c': 'aurora-c 25s ease-in-out infinite',
        sheen: 'sheen 3.6s ease-in-out infinite',
        'grid-flow': 'grid-flow 3s linear infinite',
        'drift-a': 'drift-a 14s ease-in-out infinite',
        'drift-b': 'drift-b 18s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
      },
    },
  },
  plugins: [],
};
