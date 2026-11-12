/** @type {import('tailwindcss').Config} */
// "The Anti-Feed" design tokens (Milestone 5c). Colours come from CSS variables in index.css,
// so evening mode only swaps the variables. Old token names (sand, forest, charcoal...) are kept
// as aliases so every screen picks up the new palette.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: v('paper'), 2: v('paper-2'), 3: v('paper-3') },
        ink: { DEFAULT: v('ink'), soft: v('grey-text'), faint: v('grey') },
        lime: { DEFAULT: '#D6FF45', ink: '#171815' },
        // Aliases from the previous palette
        forest: { DEFAULT: v('ink'), 600: v('ink'), 700: v('ink') },
        sage: { DEFAULT: v('grey'), ink: v('grey-text'), 100: v('paper-2'), 200: v('paper-3') },
        olive: { DEFAULT: v('grey'), ink: v('grey-text'), 100: v('paper-2'), 200: v('paper-3') },
        sand: { DEFAULT: v('paper'), 50: v('paper'), 200: v('paper-2'), 300: v('paper-3') },
        terra: { DEFAULT: v('ink'), ink: v('ink'), 600: v('ink'), 100: v('paper-2') },
        charcoal: { DEFAULT: v('ink'), 500: v('grey-text'), 400: v('grey-text') },
        honey: { DEFAULT: v('grey'), ink: v('grey-text'), 100: v('paper-2') },
        rule: 'rgb(var(--ink) / 0.16)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Heebo', 'system-ui', 'sans-serif'],
        serif: ['"Space Grotesk"', 'Heebo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { none: '0', full: '0', sm: '0', DEFAULT: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', media: '0', card: '0' },
      boxShadow: { soft: 'none', card: 'none' },
      transitionDuration: { DEFAULT: '120ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
    },
  },
  plugins: [],
}
