/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind v4 auto-detects template files via the @tailwindcss/vite plugin,
  // but we declare content globs explicitly for clarity/compatibility with
  // tooling that still reads this file (e.g. editor plugins, linters).
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
