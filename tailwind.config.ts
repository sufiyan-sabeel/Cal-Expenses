import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--surface-canvas)",
        elevated1: "var(--surface-elevated-1)",
        elevated2: "var(--surface-elevated-2)",
        borderSubtle: "var(--border-subtle)",
        borderStrong: "var(--border-strong)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textTertiary: "var(--text-tertiary)",
        textDisabled: "var(--text-disabled)",
        accent: "var(--accent-primary)",
        accentSubtle: "var(--accent-primary-subtle)",
        income: "var(--semantic-income)",
        expense: "var(--semantic-expense)",
        warning: "var(--semantic-warning)",
        danger: "var(--semantic-danger)",
        info: "var(--semantic-neutral-info)",
      },
      fontFamily: {
        base: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-lexend)", "Lexend", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["15px", { lineHeight: "22px" }],
        md: ["17px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["26px", { lineHeight: "32px" }],
        "2xl": ["34px", { lineHeight: "40px" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        full: "999px",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
      },
      maxWidth: {
        content: "1440px",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        fadeIn: "fadeIn 0.3s ease-out",
        pulseDot: "pulseDot 1.4s infinite",
      },
      boxShadow: {
        e1: "0 1px 2px rgba(0,0,0,0.06)",
        e2: "0 4px 12px rgba(0,0,0,0.10)",
        e3: "0 12px 32px rgba(0,0,0,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
