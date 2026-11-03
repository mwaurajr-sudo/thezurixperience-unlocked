// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// Netlify builds use the Netlify plugin; every other host (Render, local) uses the
// default Cloudflare Workers build, which `npm start` serves via wrangler.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

const onNetlify = !!process.env.NETLIFY;

export default onNetlify
  ? defineConfig({ cloudflare: false, plugins: [netlify()] })
  : defineConfig();
