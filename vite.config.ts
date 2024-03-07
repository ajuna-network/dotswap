import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const pluginsList = {
    plugins: [react(), svgr()],
  };

  if (command === "serve") {
    return {
      server: {
        host: "dedswap.local",
      },
      plugins: [...pluginsList.plugins, mkcert(), EnvironmentPlugin("all")],
    };
  }

  return { ...pluginsList };
});
