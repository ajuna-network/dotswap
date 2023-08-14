import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import mkcert from "vite-plugin-mkcert";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
  },
  plugins: [react(), svgr(), mkcert(), eslint()],
});
