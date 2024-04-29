import type { Config } from "tailwindcss";
import themeGenerator from "./generator";

export const themePreset = {
  darkMode: ["selector"],
  content: [],
  plugins: [themeGenerator],
} satisfies Config;
