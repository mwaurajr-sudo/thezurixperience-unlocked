import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const preset = process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : "node-server");

export default defineConfig({
  cloudflare: false,
  vite: {
    plugins: [nitro({ preset })],
  },
});

