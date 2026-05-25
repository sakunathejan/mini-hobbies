/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#12151c",
        asphalt: "#1f2937",
        ember: "#ef4444",
        chrome: "#e5e7eb",
        mint: "#2dd4bf"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
