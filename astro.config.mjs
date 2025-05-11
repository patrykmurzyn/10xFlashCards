// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
    build: {
      rollupOptions: {
        external: [
          "@testing-library/dom",
          "@testing-library/user-event",
          "@testing-library/react",
        ],
      },
    },
    ssr: {
      noExternal: ["@radix-ui/*"],
    },
    optimizeDeps: {
      exclude: [
        "@testing-library/dom",
        "@testing-library/user-event",
        "@testing-library/react",
      ],
    },
  },
});
