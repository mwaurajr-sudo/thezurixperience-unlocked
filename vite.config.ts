// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// Netlify builds use the Netlify plugin; every other host (Render, Vercel, local) uses Nitro.
// On Render, `npm start` runs render-start.mjs, which serves the Nitro build and the backend.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { nitro } from "nitro/vite";

const preset = process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : "node-server");

export default process.env.NETLIFY
  ? defineConfig({ cloudflare: false, plugins: [netlify()] })
  : defineConfig({ cloudflare: false, vite: { plugins: [nitro({ preset })] } });
