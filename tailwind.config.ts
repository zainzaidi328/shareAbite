import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",
        "background-alt": "#12121A",
        foreground: "#FAFAFA",
        muted: "#1A1A24",
        "muted-foreground": "#71717A",
        accent: {
          DEFAULT: "#F59E0B",
          foreground: "#0A0A0F",
          muted: "rgba(245, 158, 11, 0.15)",
        },
        card: "rgba(26, 26, 36, 0.6)",
        "card-solid": "#1A1A24",
        line: "rgba(255, 255, 255, 0.08)",
        "line-hover": "rgba(255, 255, 255, 0.15)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 20px rgba(245, 158, 11, 0.15)",
        "glow-md": "0 0 40px rgba(245, 158, 11, 0.2)",
        "glow-lg": "0 0 60px rgba(245, 158, 11, 0.25)",
        "glow-btn": "0 0 20px rgba(245, 158, 11, 0.4)",
        "border-glow":
          "0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)",
        "elev-sm": "0 1px 2px rgba(0, 0, 0, 0.3)",
        "elev-md": "0 4px 6px rgba(0, 0, 0, 0.3)",
        "elev-lg": "0 10px 15px rgba(0, 0, 0, 0.3)",
        "elev-xl": "0 20px 25px rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 500ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
