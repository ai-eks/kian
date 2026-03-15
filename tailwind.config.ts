import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        surface: '#0f172a',
        muted: '#94a3b8',
        accent: '#22c55e'
      },
      boxShadow: {
        panel: '0 6px 24px rgba(0, 0, 0, 0.32)'
      }
    }
  },
  plugins: []
} satisfies Config;
