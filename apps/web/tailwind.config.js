/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d1117',
          50: '#1a2235',
          100: '#111827',
          200: '#0d1117',
          300: '#080b12',
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 40px rgba(99,102,241,0.15)',
        'glow-amber': '0 0 40px rgba(251,191,36,0.15)',
        'glow-emerald': '0 0 40px rgba(16,185,129,0.12)',
        'glow-sm': '0 0 20px rgba(99,102,241,0.1)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse_glow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
