/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F',
        card: '#16161E',
        accent: {
          DEFAULT: '#3B82F6',
          glow: 'rgba(59, 130, 246, 0.3)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        destructive: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
