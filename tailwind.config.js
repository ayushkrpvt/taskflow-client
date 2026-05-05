/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#94ECBE',   // mint green — buttons, accents, highlights
          light:   '#E6FFF3',   // very light mint — hover backgrounds, badges
          dark:    '#003A26',   // deep green — hover states on dark surfaces
        },
        brand: {
          dark:    '#1A141F',   // near-black purple — sidebar, dark surfaces
          green:   '#003A26',   // deep green
          forest:  '#1E3F20',   // forest green
          mint:    '#94ECBE',   // mint accent
        },
      },
    },
  },
  plugins: [],
};
