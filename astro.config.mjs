// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
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
