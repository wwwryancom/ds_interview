/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Piggy palette: soft rose + sage + cream
        cream: "#FBF7F2",
        rose: {
          50: "#FCEFF1",
          100: "#F8DEE3",
          200: "#F0BFC8",
          300: "#E59FAD",
          400: "#D97F92",
          500: "#CC6A80",
          600: "#B5566C",
        },
        sage: {
          50: "#F0F3EC",
          100: "#DDE5D3",
          200: "#BCCBA9",
          300: "#9CAF88",
          400: "#84996F",
          500: "#6C805A",
        },
        sky: {
          200: "#C5D7E6",
          300: "#A9C2D9",
        },
        ink: {
          DEFAULT: "#3F3A40",
          soft: "#6E6770",
          faint: "#9C96A0",
        },
      },
      fontFamily: {
        display: ['"LXGW WenKai TC"', '"Noto Sans SC"', "serif"],
        softtitle: ["Nunito", '"LXGW WenKai TC"', '"Noto Sans SC"', "system-ui", "sans-serif"],
        sans: ["Nunito", '"Noto Sans SC"', "system-ui", "sans-serif"],
        question: ["Nunito", '"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(80, 60, 70, 0.18)",
        card: "0 2px 14px -6px rgba(80, 60, 70, 0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
