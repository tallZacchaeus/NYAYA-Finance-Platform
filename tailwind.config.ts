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
        // ── Surfaces ──────────────────────────────────────────────────────────
        bg: {
          primary: "#0A0616",
          card:    "#13093B",
          hover:   "#1A0F4D",
          subtle:  "#1F1450",
        },
        // ── Royal Purple (RCCG signature) ─────────────────────────────────────
        royal: {
          DEFAULT: "#2D1A73",
          light:   "#3D2590",
          dark:    "#13093B",
        },
        // ── Imperial Gold (YAYA crest) ────────────────────────────────────────
        gold: {
          deep:    "#8B6A28",
          DEFAULT: "#BB913B",
          bright:  "#D4A843",
        },
        // ── Forest Green (YAYA banner) ────────────────────────────────────────
        forest: {
          deep:    "#0F4E1E",
          DEFAULT: "#146428",
          light:   "#5EBE7C",
          bright:  "#8EDC9E",
        },
        // ── Text ──────────────────────────────────────────────────────────────
        text: {
          primary: "#F5E8D3",
          muted:   "#A89FB8",
        },
        // ── Status fills ──────────────────────────────────────────────────────
        status: {
          submitted:        "#3D2A0A",
          finance_reviewed: "#1A2F4D",
          satgo_approved:   "#3D2D0F",
          partial_payment:  "#2E1F4D",
          paid:             "#123D2A",
          receipted:        "#0F3D38",
          completed:        "#0F4E1E",
          rejected:         "#3D1F1F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)", "-apple-system", "sans-serif"],
      },
      keyframes: {
        fadeSlideIn: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.85)" },
        },
        progressFill: {
          "0%":   { width: "0%" },
          "100%": { width: "var(--target-width, 100%)" },
        },
        countUp: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-slide-in": "fadeSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "pulse-dot":     "pulseDot 2s ease-in-out infinite",
        "progress-fill": "progressFill 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
