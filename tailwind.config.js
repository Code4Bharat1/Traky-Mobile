/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f6f7f9",
        "surface-low": "#ffffff",
        "surface-container": "#f1f2f4",
        "surface-high": "#e9eaec",
        "surface-highest": "#e1e3e6",
        foreground: "#0f172a",
        "foreground-muted": "#1f2937",
        primary: "#2573e6",
        "on-primary": "#ffffff",
        outline: "rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
}
