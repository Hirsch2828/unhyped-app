/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#2E3A2F', 600: '#3a4a3b', 700: '#26302a' },
        sage: { DEFAULT: '#66705A', 100: '#e9ebe2', 200: '#d6dacb' },
        olive: { DEFAULT: '#A7B08D' },
        sand: { DEFAULT: '#F5F1E8', 50: '#FBF9F4', 200: '#ECE6D9', 300: '#E0D8C7' },
        terra: { DEFAULT: '#D77B5A', 600: '#c4643f', 100: '#f7e3da' },
        charcoal: { DEFAULT: '#1F1F1F', 500: '#55524b', 400: '#7c776c' },
        honey: { DEFAULT: '#c99a2e', 100: '#f6ecd2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(31,31,31,.04), 0 8px 24px -16px rgba(31,31,31,.18)' },
    },
  },
  plugins: [],
}
