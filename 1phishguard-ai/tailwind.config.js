/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0a0f1e',
        ink: '#0f172a',
        primary: '#2563eb',
        cyan: '#06b6d4',
        safe: '#10b981',
        suspicious: '#f59e0b',
        phishing: '#ef4444',
      },
      fontFamily: {
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 36px rgba(37, 99, 235, 0.24)',
        cyan: '0 0 36px rgba(6, 182, 212, 0.16)',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease both',
        'soft-pulse': 'softPulse 2.4s ease-in-out infinite',
        'scan-line': 'scanLine 3.2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(18px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        softPulse: {
          '0%, 100%': { opacity: 0.66 },
          '50%': { opacity: 1 },
        },
        scanLine: {
          '0%': { transform: 'translateY(-10%)' },
          '100%': { transform: 'translateY(110%)' },
        },
      },
    },
  },
  plugins: [],
};
