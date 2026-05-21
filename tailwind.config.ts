import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#ffffff",
          deep: "#f5f5f5",
        },
        ink: {
          DEFAULT: "#14110d",
          soft: "#3a342b",
        },
        mute: "#7a6f5c",
        rule: "#2a241c",
        ochre: {
          DEFAULT: "#c5491f",
          deep: "#8a2d10",
        },
        moss: "#3d4a2a",
        gold: "#b38238",
        indigo: {
          DEFAULT: "#1e2b42",
          deep: "#0f1826",
        },
        night: "#0c0a07",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
