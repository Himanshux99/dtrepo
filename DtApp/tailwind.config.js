// tailwind.config.js
import { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {colors: {
        primary: "#463B68",    // blue-600
        secondary: "#000000ff",  // gray-500
        accent: "#f97316",     // orange-500
      },},
  },
  plugins: [],
};
