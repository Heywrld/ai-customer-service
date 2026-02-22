import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
      },
      backgroundImage: {
        "han-gradient": "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
        "han-gradient-dark": "linear-gradient(135deg, #38BDF8 0%, #22D3EE 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
