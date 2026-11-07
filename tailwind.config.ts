import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f1f5f9",
        primary: "#f97316",
        secondary: "#eab308",
        surface: "rgba(255, 255, 255, 0.65)",
      },
      boxShadow: {
        'orange-glow': '0 4px 20px rgba(249, 115, 22, 0.15)',
      },
      backgroundImage: {
        'btn-gradient': 'linear-gradient(to right, #f97316, #eab308)',
        'glass-gradient': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4))',
      }
    },
  },
  plugins: [],
};
export default config;