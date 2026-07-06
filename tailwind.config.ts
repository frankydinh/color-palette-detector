import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neutral dark palette (dark-mode-first). The live accent is injected
        // at runtime via CSS custom properties (see App.tsx / index.css).
        surface: {
          DEFAULT: '#0e0f13',
          raised: '#16181f',
          overlay: '#1d2029',
          border: '#2a2e3a',
        },
        content: {
          DEFAULT: '#e7e9ee',
          muted: '#9aa0ad',
          faint: '#6b7280',
        },
        accent: {
          DEFAULT: 'var(--accent, #6366f1)',
          fg: 'var(--accent-fg, #ffffff)',
          soft: 'var(--accent-soft, rgba(99,102,241,0.15))',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      keyframes: {
        'swatch-in': {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--accent-soft)' },
          '50%': { boxShadow: '0 0 0 8px var(--accent-soft)' },
        },
      },
      animation: {
        'swatch-in': 'swatch-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'toast-in': 'toast-in 0.25s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'pulse-glow': 'pulse-glow 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
