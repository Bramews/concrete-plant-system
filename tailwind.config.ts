import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.6" }] /* 13px minimum safe */,
        sm: ["0.875rem", { lineHeight: "1.6" }] /* 14px default UI */,
        base: ["0.9375rem", { lineHeight: "1.7" }] /* 15px standard */,
        lg: ["1.125rem", { lineHeight: "1.6" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-cairo)", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        blob: "blob 7s infinite",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
      },
    },
  },
  plugins: [
    tailwindAnimate,
    plugin(function ({ addComponents }) {
      addComponents({
        /* Typography Design System Components */
        ".text-display": {
          fontSize: "2.5rem",
          lineHeight: "1.3",
          fontWeight: "800",
          letterSpacing: "-0.02em",
        },
        ".text-page-title": {
          fontSize: "1.875rem",
          lineHeight: "1.4",
          fontWeight: "700",
          letterSpacing: "-0.01em",
        },
        ".text-section-title": {
          fontSize: "1.25rem",
          lineHeight: "1.5",
          fontWeight: "700",
        },
        ".text-card-title": {
          fontSize: "1rem",
          lineHeight: "1.6",
          fontWeight: "600",
        },
        ".text-body": {
          fontSize: "0.9375rem" /* 15px - optimal for mixed language UI */,
          lineHeight: "1.7",
          fontWeight: "500",
        },
        ".text-table": {
          fontSize: "0.875rem" /* 14px */,
          lineHeight: "1.6",
          fontWeight: "500",
        },
        ".text-caption": {
          fontSize: "0.8125rem" /* 13px - never go below this */,
          lineHeight: "1.6",
          fontWeight: "600",
        },
        ".text-helper": {
          fontSize: "0.75rem" /* 12px - strictly for badges/tiny metadata */,
          lineHeight: "1.5",
          fontWeight: "600",
        },
      });
    }),
  ],
};
export default config;
