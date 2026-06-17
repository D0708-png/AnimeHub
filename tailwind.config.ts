import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f7f8ff",
        paper: "#070812",
        night: "#05060d",
        navy: "#0b1026",
        graphite: "#11131f",
        signal: "#ff4d6d",
        aqua: "#18b7be",
        cyan: "#34d8ff",
        ember: "#ff8a2a",
        lemon: "#f3c846",
        violet: "#7c5cff",
        plasma: "#b56cff"
      },
      boxShadow: {
        soft: "0 14px 34px rgba(15, 23, 42, 0.12)",
        line: "0 0 0 1px rgba(255, 255, 255, 0.1)",
        glow: "0 10px 28px rgba(14, 165, 183, 0.12)",
        ember: "0 12px 28px rgba(232, 93, 4, 0.12)"
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      fontFamily: {
        sans: ["var(--font-app-sans)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular"]
      }
    }
  },
  plugins: []
};

export default config;
