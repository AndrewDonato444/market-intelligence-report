import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A",
          hover: "#1E293B",
          light: "#F1F5F9",
        },
        accent: {
          DEFAULT: "#CA8A04",
          hover: "#A16207",
          light: "#FEF9C3",
        },
        background: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          DEFAULT: "#020617",
          secondary: "#475569",
          tertiary: "#94A3B8",
          inverse: "#F8FAFC",
        },
        success: "#15803D",
        warning: "#B45309",
        error: "#B91C1C",
        report: {
          bg: "#FAFAF9",
          "accent-line": "#CA8A04",
          "pullquote-bg": "#0F172A",
          "metric-highlight": "#CA8A04",
          "rating-a": "#15803D",
          "rating-b": "#B45309",
          "rating-c": "#B91C1C",
        },
        confidence: {
          fill: "#0F172A",
          empty: "#E2E8F0",
          half: "#94A3B8",
        },
        chart: {
          primary: "#0F172A",
          secondary: "#334155",
          tertiary: "#64748B",
          accent: "#CA8A04",
          positive: "#15803D",
          negative: "#B91C1C",
          neutral: "#94A3B8",
          grid: "#E2E8F0",
          label: "#475569",
        },
      },
      fontFamily: {
        serif: [
          "Playfair Display",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "monospace",
        ],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        md: "0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
        lg: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
      },
      transitionDuration: {
        fast: "100ms",
        default: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        default: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
