import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#323232",
        canvas: "#F8F8F8",
        accent: "#A855F8",
      },
      borderRadius: {
        panel: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
