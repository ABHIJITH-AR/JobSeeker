/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#173B70',
        navyLight: '#1E4A85',
        brand: '#2563EB',
        brandDark: '#1D4ED8',
        skysoft: '#EAF2FC',
        ink: '#172B4D',
        muted: '#64748B',
        line: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(23, 59, 112, 0.06)',
        cardHover: '0 12px 32px rgba(23, 59, 112, 0.12)',
        soft: '0 2px 10px rgba(23, 59, 112, 0.05)',
      },
      borderRadius: {
        xl: '0.85rem',
        '2xl': '1.15rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out',
        'toast-in': 'toast-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
