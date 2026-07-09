export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        amazon: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
      colors: {
        amazon: {
          background: "#EAEDED",
          DEFAULT:    "#131921",   // top nav bar
          dark_blue:  "#232F3E",   // sub nav bar
          light_blue: "#232F3E",   // alias kept for compat
          yellow:     "#FFD814",   // Add to Cart button
          orange:     "#FF9900",   // search btn / accent / smile
          star:       "#FFA41C",   // star rating fill
          "yellow-muted": "#FEBD69",
        },
        brand: {
          blue:         '#1d4ed8',
          'blue-light': '#2563eb',
          'blue-dark':  '#1e40af',
          gold:         '#f59e0b',
          navy:         '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
