/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-bg': '#070A0F',
        'sec-bg': '#0C1118',
        'card-bg': '#111720',
        'elev-bg': '#151D28',
        'border': '#202A36',
        'primary': '#4F8CFF',
        'primary-glow': '#4F8CFF22',
        'success': '#20D69A',
        'warning': '#FFB84D',
        'danger': '#FF5C6C',
        'main-text': '#F4F7FB',
        'sec-text': '#8995A5',
        'muted-text': '#566170',
      }
    },
  },
  plugins: [],
}
