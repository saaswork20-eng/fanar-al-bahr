import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fanar: {
          dark: "#0a0c10",
          card: "#12161f",
          surface: "#181e2b",
          border: "#232a3b",
          accent: "#6366f1", // electric indigo
          cyan: "#06b6d4",
          gold: "#f59e0b",
          green: "#10b981",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
