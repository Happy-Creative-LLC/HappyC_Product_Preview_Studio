export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        amazon: {
          background: "#EAEDED",
          light_blue: "#232F3E",
          yellow: "#FEBD69",
          DEFAULT: "#131921",
        },
        brand: {
          blue:      '#1d4ed8',
          'blue-light': '#2563eb',
          'blue-dark':  '#1e40af',
          gold:      '#f59e0b',
          navy:      '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
