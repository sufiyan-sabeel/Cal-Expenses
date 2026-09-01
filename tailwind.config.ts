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
        // Legacy compat
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
        // design(1).md §6
        brand50: "var(--color-brand-50)",
        brand500: "var(--color-brand-500)",
        brand600: "var(--color-brand-600)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        surfaceElevated: "var(--color-surface-elevated)",
        surfaceHover: "var(--color-surface-hover)",
        border: "var(--color-border)",
        textMuted: "var(--color-text-muted)",
        incomeNew: "var(--color-income)",
        expenseNew: "var(--color-expense)",
        warningNew: "var(--color-warning)",
        error: "var(--color-error)",
        event: "var(--color-event)",
        gift: "var(--color-gift)",
        goal: "var(--color-goal)",
        ai: "var(--color-ai)",
      },
      fontFamily: {
        base: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-lexend)", "Lexend", "Inter", "system-ui", "sans-serif"],
        sans: ["var(--font-family-base)"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["15px", { lineHeight: "22px" }],
        md: ["17px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["26px", { lineHeight: "32px" }],
        "2xl": ["34px", { lineHeight: "40px" }],
        // design(1).md §7
        display: ["var(--font-size-display)", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["var(--font-size-h1)", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["var(--font-size-h2)", { lineHeight: "1.25", fontWeight: "600" }],
        h3: ["var(--font-size-h3)", { lineHeight: "1.3", fontWeight: "600" }],
        financialLg: ["var(--font-size-financial-lg)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        financialMd: ["var(--font-size-financial-md)", { lineHeight: "1.15", fontWeight: "700" }],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
        // legacy
        // sm: "6px", md: "10px", lg: "16px"
      },
      spacing: {
        "1": "var(--space-1)",
        "2": "var(--space-2)",
        "3": "var(--space-3)",
        "4": "var(--space-4)",
        "5": "var(--space-5)",
        "6": "var(--space-6)",
        "8": "var(--space-8)",
        "10": "var(--space-10)",
        "12": "var(--space-12)",
        "16": "var(--space-16)",
      },
      maxWidth: {
        content: "1280px",
      },
      screens: {
        mobile: "320px",
        "mobile-lg": "480px",
        tablet: "768px",
        desktop: "1024px",
        "desktop-lg": "1440px",
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
        shimmer: "shimmer 1.2s infinite",
        fadeIn: "fadeIn var(--motion-duration-slow, 320ms) var(--motion-easing-decelerate, cubic-bezier(0,0,0,1))",
        pulseDot: "pulseDot 1.4s infinite",
      },
      boxShadow: {
        e1: "var(--elevation-1)",
        e2: "var(--elevation-2)",
        e3: "var(--elevation-3)",
        e4: "var(--elevation-4)",
        // legacy fallback
        // e1: "0 1px 2px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
