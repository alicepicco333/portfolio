module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      mob: "375px",
      tablet: "768px",
      map: "1152px",
      laptop: "1024px",
      desktop: "1280px",
      laptopl: "1440px",
    },
    extend: {
      colors: {
        bone: "rgb(var(--bone) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        olive: "rgb(var(--olive) / <alpha-value>)",
        khaki: "rgb(var(--khaki) / <alpha-value>)",
        concrete: "rgb(var(--concrete) / <alpha-value>)",
        graphite: "rgb(var(--graphite) / <alpha-value>)",
        fieldgrey: "rgb(var(--field-grey) / <alpha-value>)",
        pink: "rgb(var(--pink) / <alpha-value>)",
        lilac: "rgb(var(--lilac) / <alpha-value>)",
        mint: "rgb(var(--mint) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      gridTemplateColumns: {
        13: "repeat(13, minmax(0, 1fr))",
        golden: "61.8fr 38.2fr",
        "golden-rev": "38.2fr 61.8fr",
      },
      gridColumn: {
        "span-13": "span 13 / span 13",
      },
      // golden-ratio type scale: 16 × φⁿ
      fontSize: {
        phi1: "26px",
        phi2: "42px",
        phi3: "68px",
        phi4: "110px",
        phi5: "178px",
        phi6: "288px",
      },
    },
  },
  plugins: [],
};
