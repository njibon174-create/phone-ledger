/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00FF88',
        'neon-blue': '#00D4FF',
        'neon-green-dim': '#00FF8833',
        'neon-blue-dim': '#00D4FF33',
        'dark-bg': '#0A0E1A',
        'sec-bg': '#111827',
        'card-bg': '#111827',
        'elev-bg': '#1E2A3A',
        'card-light': '#1E2A3A',
        'border': '#1E3A5F',
        'main-text': '#F0F8FF',
        'sec-text': '#7EB8DA',
        'muted-text': '#4A7A9B',
        // Semantic aliases — these override Tailwind defaults
        'success': '#39FF88',
        'danger': '#F87171',
        'warning': '#FBBF24',
        'info': '#60A5FA',
      },
      textColor: {
        'success': '#39FF88',
        'danger': '#F87171',
        'warning': '#FBBF24',
        'info': '#60A5FA',
        'neon-green': '#00FF88',
        'neon-blue': '#00D4FF',
      },
      backgroundColor: {
        'success': '#39FF8820',
        'danger': '#F8717120',
        'warning': '#FBBF2420',
        'info': '#60A5FA20',
      },
      borderColor: {
        'success': '#39FF8850',
        'danger': '#F8717150',
        'warning': '#FBBF2450',
        'info': '#60A5FA50',
      },
    },
  },
  plugins: [],
}
