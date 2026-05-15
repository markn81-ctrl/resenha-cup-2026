import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#07111f",
        ink: "#f7f5f0",
        brand: {
          50: "#eefcf7",
          100: "#d2f7ea",
          200: "#aaf0d3",
          300: "#72e2b6",
          400: "#2ece92",
          500: "#0cad72",
          600: "#0b8c5d",
          700: "#0d6f4d",
          800: "#0f573e",
          900: "#0f4835"
        },
        accent: {
          50: "#fdf4ea",
          100: "#fbe4c5",
          200: "#f7c98b",
          300: "#f0a756",
          400: "#eb8431",
          500: "#d96a20",
          600: "#bb5018",
          700: "#973c16",
          800: "#7a3118",
          900: "#642a17"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px rgba(6, 17, 34, 0.45)"
      },
      backgroundImage: {
        "hero-grid": "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
