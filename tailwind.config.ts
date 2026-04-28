import type { Config } from 'tailwindcss';

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          50: 'rgb(var(--ink-50) / <alpha-value>)',
        },
        amber: {
          DEFAULT: 'rgb(var(--amber) / <alpha-value>)',
          dim: 'rgb(var(--amber-dim) / <alpha-value>)',
        },
        signal: {
          ok: 'rgb(var(--signal-ok) / <alpha-value>)',
          err: 'rgb(var(--signal-err) / <alpha-value>)',
          warn: 'rgb(var(--signal-warn) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        'ui-2xs': 'var(--ui-text-2xs)',
        'ui-xs': 'var(--ui-text-xs)',
        'ui-sm': 'var(--ui-text-sm)',
        'ui-base': 'var(--ui-text-base)',
        'ui-lg': 'var(--ui-text-lg)',
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      boxShadow: {
        'inset-hair': 'inset 0 0 0 1px rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
