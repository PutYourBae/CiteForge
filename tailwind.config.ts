/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:      '#0F1117',
        surface:   '#1A1D27',
        surface2:  '#21253A',
        accent:    '#4F8EF7',
        purple:    '#7C3AED',
        success:   '#10B981',
        warning:   '#F59E0B',
        danger:    '#EF4444',
        border:    '#2D3149',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
