import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified NEXLAPTECH theme tokens
        nex: {
          primary: "var(--color-primary, #1E5BFF)",
          primaryHover: "var(--color-primary-hover, #1748D0)",
          primarySoft: "var(--color-primary-soft, #EAF0FF)",
          accent: "var(--color-accent, #19C3F0)",
          accentHover: "var(--color-accent-hover, #149DC8)",
          accentSoft: "var(--color-accent-soft, #E8FAFF)",
          bg: "var(--color-background, #FFFFFF)",
          surface: "var(--color-surface, #FFFFFF)",
          surface2: "var(--color-surface-secondary, #F5F8FF)",
          border: "var(--color-border, #E2E8F0)",
          text: "var(--color-text, #0B1F4D)",
          textMuted: "var(--color-text-secondary, #64748B)",
          textSoft: "var(--color-text-soft, #94A3B8)",
          // Backward compatibility mappings
          blue: "var(--color-primary, #1E5BFF)",
          blueLight: "var(--color-primary-soft, #EAF0FF)",
          blueDeep: "var(--color-primary-hover, #1748D0)",
          white: "var(--color-surface, #FFFFFF)",
          mist: "var(--color-text-secondary, #0B1F4D)",
        },
        // Premium Futuristic Enterprise Design Palette
        futuristic: {
          midnight: "#070B1A",       // Deep midnight navy
          deepViolet: "#0B0718",     // Deep black-violet
          cardDark: "rgba(15, 23, 42, 0.75)",
          borderDark: "rgba(255, 255, 255, 0.08)",
          indigo: "#4338CA",         // Enterprise Indigo
          cyan: "#22D3EE",           // Electric Cyan
          violet: "#8B5CF6",         // Neon Violet
          holoBlue: "#38BDF8",       // Holographic Blue
          amber: "#F59E0B",          // Amber
          // Text tokens
          headingDark: "#F8FAFC",
          bodyDark: "#CBD5E1",
          secondaryDark: "#94A3B8",
          mutedDark: "#A8B3C7",
          linkDark: "#67E8F9",
          headingLight: "#0F172A",
          bodyLight: "#334155",
          secondaryLight: "#475569",
          borderLight: "#CBD5E1",
        },
        blue: {
          50: "#f0f5ff",
          100: "#e0eaff",
          200: "#c2d5ff",
          300: "#91b4ff",
          400: "#5d8eff",
          500: "#1e5bff",
          600: "#1e5bff",
          700: "#1e5bff",
          800: "#0b1f4d",
          900: "#0b1f4d",
        },
        cyan: {
          50: "#edfbff",
          100: "#d6f6ff",
          200: "#b0edff",
          300: "#79dfff",
          400: "#19c3f0",
          500: "#19c3f0",
          600: "#149dc8",
          700: "#127b9c",
          800: "#125f78",
          900: "#154e61",
        },
      },
      fontFamily: {
        display: [
          "BatmanForeverAlternate",
          "Batman Forever",
          "var(--font-display)",
          "sans-serif",
        ],
        batman: [
          "BatmanForeverAlternate",
          "Batman Forever",
          "sans-serif",
        ],
        body: ["var(--font-body)", "Plus Jakarta Sans", "sans-serif"],
        sans: ["var(--font-body)", "Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        "glow-blue": "0 0 20px var(--color-primary-glow, rgba(14,165,233,0.25)), 0 0 60px var(--color-primary-soft, rgba(14,165,233,0.15))",
        "glow-pink": "0 0 20px var(--color-accent-glow, rgba(25,195,240,0.22)), 0 0 60px var(--color-accent-soft, rgba(25,195,240,0.15))",
        "glow-blue-lg": "0 0 40px var(--color-primary-glow, rgba(14,165,233,0.35)), 0 0 100px var(--color-primary-soft, rgba(14,165,233,0.2))",
        "glass": "0 8px 32px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 50% 0%, var(--color-primary-soft, rgba(14,165,233,0.15)), transparent 60%)",
        "hero-radial":
          "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-primary-glow, rgba(14,165,233,0.25)), transparent 70%)",
        "hero-ambient":
          "radial-gradient(circle at 20% 20%, rgba(30,91,255,0.12), transparent 40%), radial-gradient(circle at 80% 80%, rgba(25,195,240,0.10), transparent 40%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", filter: "blur(20px)" },
          "50%": { opacity: "1", filter: "blur(28px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        marquee: "marquee 30s linear infinite",
        "scan-line": "scan-line 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
