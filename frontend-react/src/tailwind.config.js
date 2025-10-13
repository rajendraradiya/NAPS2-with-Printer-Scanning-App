/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        customPrimary: "#134D57",
        customSecondary: "#D7F3F9",
        EerieBlack: "#1E1E1E",
        customWarning: "#FFA502",
        // Add more custom colors as needed
      },
      screens: {
        mob: "280px",
        tab: "640px",
        xsm: "375px",
        // => @media (min-width: 640px) { ... }

        lap: "1024px",
        // => @media (min-width: 1024px) { ... }

        desktop: "1280px",
        // => @media (min-width: 1280px) { ... }
      },
    },
  },
  plugins: [],
};
