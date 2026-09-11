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
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Main Indigo
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
        },
        rose: {
          500: '#F43F5E',
          600: '#E11D48',
        },
        amber: {
          500: '#F59E0B',
          600: '#D97706',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
          darker: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
