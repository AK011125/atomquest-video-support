import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        cloud: "#f6f8fb",
        signal: "#0f766e",
        amber: "#b7791f"
      }
    }
  },
  plugins: []
} satisfies Config;
