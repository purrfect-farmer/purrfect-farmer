import defaultTheme from "tailwindcss/defaultTheme";
import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Product Sans", ...defaultTheme.fontFamily.sans],
        "turret-road": "Turret Road",
      },
      colors: {
        "birdton-blue": {
          DEFAULT: "#4DC5FF",
          50: "#FFFFFF",
          100: "#F0FAFF",
          200: "#C7EDFF",
          300: "#9FE0FF",
          400: "#76D2FF",
          500: "#4DC5FF",
          600: "#15B3FF",
          700: "#0094DC",
          800: "#006EA4",
          900: "#00496C",
          950: "#003650",
        },
        "blum-green": {
          DEFAULT: "#BAEE52",
          50: "#FDFEF9",
          100: "#F5FDE7",
          200: "#E6F9C1",
          300: "#D8F59C",
          400: "#C9F277",
          500: "#BAEE52",
          600: "#A6E91F",
          700: "#84BD13",
          800: "#618A0E",
          900: "#3D5709",
          950: "#2B3E06",
        },

        "pumpad-green": {
          DEFAULT: "#71FF45",
          50: "#FDFFFD",
          100: "#EEFFE8",
          200: "#CEFFBF",
          300: "#AFFF97",
          400: "#90FF6E",
          500: "#71FF45",
          600: "#46FF0D",
          700: "#32D400",
          800: "#259C00",
          900: "#186400",
          950: "#114800",
        },
        "wonton-green": {
          DEFAULT: "#7DE701",
          50: "#C1FE78",
          100: "#B7FE64",
          200: "#A4FE3B",
          300: "#92FE13",
          400: "#7DE701",
          500: "#5FAF01",
          600: "#417701",
          700: "#223F00",
          800: "#040800",
          900: "#000000",
          950: "#000000",
        },
      },
    },
  },
  plugins: [tailwindScrollbar],
};
