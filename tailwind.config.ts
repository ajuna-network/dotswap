import type { Config } from "tailwindcss";
import { themePreset } from "./src/app/config/tailwind/preset";

const config = {
  presets: [themePreset],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
} satisfies Config;

export default config;
