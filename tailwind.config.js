/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Esquema de colores oscuros
        'lavender-light': '#E8EAFF',
        'dark-bg': '#121212',
        'dark-card': '#1E1E1E',
        'dark-surface': '#242424',
        'dark-border': '#333333',
        'dark-text': '#E0E0E0',
        'dark-text-secondary': '#A0A0A0',
        // Colores principales
        'purple-dark': '#2d1b69',
        'purple-vibrant': '#9c27b0',
        'purple-light': '#ba68c8',
      },
      boxShadow: {
        'dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'dark-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'purple-glow': '0 0 15px rgba(156, 39, 176, 0.5)',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #2D1B69 0%, #9C27B0 100%)',
      }
    },
  },
  plugins: [],
}
