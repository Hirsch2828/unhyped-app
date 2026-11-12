/** @type {import('tailwindcss').Config} */
// "Quiet Broadsheet" design tokens. Base palette is fixed; tints are derived from it.
// The *-ink shades are darker versions used only for small text (WCAG AA on sand).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#2E3A2F', 600: '#3a4a3b', 700: '#26302a' },
        sage: { DEFAULT: '#66705A', ink: '#56604a', 100: '#e9ebe2', 200: '#d6dacb' },
        olive: { DEFAULT: '#A7B08D', ink: '#6b7350', 100: '#e8eadc', 200: '#d3d8bf' },
        sand: { DEFAULT: '#F5F1E8', 50: '#FBF9F4', 200: '#ECE6D9', 300: '#E0D8C7' },
        terra: { DEFAULT: '#D77B5A', ink: '#b25a38', 600: '#c4643f', 100: '#f7e3da' },
        charcoal: { DEFAULT: '#1F1F1F', 500: '#4f4c46', 400: '#67635a' },
        honey: { DEFAULT: '#C99A2E', ink: '#85650f', 100: '#f6ecd2' },
        rule: 'rgb(31 31 31 / 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: { media: '20px', card: '14px' },
      boxShadow: {
        soft: '0 1px 2px rgb(31 31 31 / .04), 0 12px 28px -18px rgb(31 31 31 / .22)',
        card: '0 1px 2px rgb(31 31 31 / .04), 0 12px 28px -18px rgb(31 31 31 / .22)',
      },
      transitionDuration: { DEFAULT: '200ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
    },
  },
  plugins: [],
}
