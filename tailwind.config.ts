import type { Config } from "tailwindcss";
import { themePreset } from "./src/app/config/tailwind/preset";

const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  presets: [themePreset],
} satisfies Config;

export default config;
