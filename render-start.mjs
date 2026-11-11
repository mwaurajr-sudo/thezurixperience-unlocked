/**
 * Render.com Unified Server
 * 
 * Runs BOTH the Nitro SSR frontend and the Express API backend
 * behind a single HTTP server on Render's PORT.
 * 
 * - /api/*  and /health  →  Express backend
 * - Everything else      →  Nitro SSR frontend
 */

import fs from "fs";
import http from "http";
import net from "net";
import { spawn } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Load backend environment variables ──────────────────────────
dotenv.config({ path: path.join(__dirname, "backend", ".env") });

// Prevent the Express backend from starting its own listener
process.env.VERCEL = "1";
process.env.NODE_ENV = "production";

// ── 2. Start Nitro SSR on an internal port ─────────────────────────
const NITRO_PORT = 3333;

const nitroProcess = spawn(
  "node",
  [path.join(__dirname, ".output", "server", "index.mjs")],
  {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(NITRO_PORT),
      NITRO_PORT: String(NITRO_PORT),
      VERCEL: "",          // Nitro doesn't need this flag
    },
    stdio: "inherit",
  }
);

nitroProcess.on("error", (err) => {
  console.error("[render-start] Failed to start Nitro process:", err);
  process.exit(1);
});

nitroProcess.on("exit", (code) => {
  if (code !== 0) {
    console.error(`[render-start] Nitro process exited with code ${code}`);
    process.exit(1);
  }
});

// Wait for Nitro to be ready
console.log("[render-start] Waiting for Nitro SSR server to start...");
await waitForPort(NITRO_PORT, 15000);
console.log(`[render-start] Nitro SSR server ready on internal port ${NITRO_PORT}`);

// ── 3. Import Express backend (won't auto‑start its listener) ──────
// The backend exits if its Supabase settings are missing, so check first and keep the site up.
let backendApp = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  ({ default: backendApp } = await import("./backend/app.js"));
  console.log("[render-start] Express backend loaded");
} else {
  console.error("[render-start] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. API requests will return 503.");
}

// ── 4. Combined HTTP server ────────────────────────────────────────
const RENDER_PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  // Route API and health requests to Express
  if (url.startsWith("/api/") || url === "/health") {
    if (!backendApp) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, message: "RSVP is temporarily unavailable. Please try again later." }));
      return;
    }
    backendApp(req, res);
    return;
  }

  // Audio and video are served here so browsers can fetch them in parts: iPhones won't play
  // media without that, and it lets guests skip through long sets without downloading them whole.
  if (MEDIA_PATH.test(url) && serveMedia(req, res)) return;

  // Proxy everything else to Nitro SSR
  proxyToNitro(req, res);
});

server.listen(RENDER_PORT, "0.0.0.0", () => {
  console.log(`\n🚀 TheZuriXperience running on port ${RENDER_PORT}`);
  console.log(`   Frontend (SSR) → Nitro @ :${NITRO_PORT}`);
  console.log(`   Backend  (API) → Express (in-process)`);
  console.log();
});

// ── Helpers ────────────────────────────────────────────────────────

const MEDIA_PATH = /^\/(gallery|recordings)\/[\w.-]+(\/[\w.-]+)?\.(mp4|m4a|mp3)(\?.*)?$/;
const MEDIA_TYPES = { ".mp4": "video/mp4", ".m4a": "audio/mp4", ".mp3": "audio/mpeg" };
const PUBLIC_DIRS = [path.join(__dirname, ".output", "public"), path.join(__dirname, "public")];

/**
 * Serves a media file from the built public folder, honouring Range requests.
 * Returns false when the file isn't there, so the request falls through to Nitro.
 */
function serveMedia(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath.includes("..")) return false;

  let file = null;
  let size = 0;
  for (const dir of PUBLIC_DIRS) {
    const candidate = path.join(dir, urlPath);
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) {
        file = candidate;
        size = stat.size;
        break;
      }
    } catch {
      // not in this folder
    }
  }
  if (!file) return false;

  const headers = {
    "Content-Type": MEDIA_TYPES[path.extname(file)] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=604800",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (range) {
    let start = range[1] === "" ? size - Number(range[2]) : Number(range[1]);
    let end = range[1] === "" || range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    if (Number.isNaN(start) || start < 0) start = 0;
    if (start > end || start >= size) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      res.end();
      return true;
    }
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end(), true;
    fs.createReadStream(file, { start, end }).pipe(res);
    return true;
  }

  res.writeHead(200, { ...headers, "Content-Length": size });
  if (req.method === "HEAD") return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

/** Proxy a request to the internal Nitro SSR server */
function proxyToNitro(req, res) {
  const options = {
    hostname: "127.0.0.1",
    port: NITRO_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${NITRO_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy] Error connecting to Nitro:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Frontend temporarily unavailable. Please try again.");
    }
  });

  req.pipe(proxyReq);
}

/** Wait until a TCP port is accepting connections */
function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket
        .on("connect", () => {
          socket.destroy();
          resolve();
        })
        .on("error", () => {
          socket.destroy();
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`));
          } else {
            setTimeout(check, 300);
          }
        })
        .on("timeout", () => {
          socket.destroy();
          setTimeout(check, 300);
        })
        .connect(port, "127.0.0.1");
    };
    check();
  });
}
