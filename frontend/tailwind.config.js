/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F766E',
          light: '#CCFBF1',
          dark: '#0D6B64',
        },
        accent: '#06B6D4',
        healthy: '#16A34A',
        warning: '#D97706',
        emergency: '#DC2626',
        bg: {
          light: '#F0FDFA',
          dark: '#0D1B2A',
        },
        card: {
          light: '#ffffff',
          dark: '#132030',
        },
        border: {
          light: '#CCFBF1',
          dark: '#1E3448',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-beat': 'pulse-beat 1s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'emergency-flash': 'emergency-flash 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'emergency-flash': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(22, 163, 74, 0.3)',
        'glow-yellow': '0 0 20px rgba(217, 119, 6, 0.3)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.4)',
        'glow-teal': '0 0 20px rgba(15, 118, 110, 0.3)',
      },
    },
  },
  plugins: [],
}
