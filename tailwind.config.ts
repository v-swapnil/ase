import type { Config } from 'tailwindcss';

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#0f0f11',
          800: '#161618',
          700: '#1d1d20',
          600: '#26262b',
          500: '#3a3a42',
          400: '#5a5a64',
          300: '#8a8a94',
          200: '#b8b8c0',
          100: '#e4e4e8',
          50: '#f5f5f7',
        },
        amber: {
          DEFAULT: '#f5a524',
          dim: '#c98615',
        },
        signal: {
          ok: '#7fb685',
          err: '#d9786b',
          warn: '#e8c468',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"IBM Plex Serif"', 'ui-serif', 'Georgia', 'serif'],
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
