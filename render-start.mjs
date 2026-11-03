/**
 * Render.com Unified Server
 * 
 * Runs BOTH the Nitro SSR frontend and the Express API backend
 * behind a single HTTP server on Render's PORT.
 * 
 * - /api/*  and /health  →  Express backend
 * - Everything else      →  Nitro SSR frontend
 */

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
const { default: backendApp } = await import("./backend/app.js");
console.log("[render-start] Express backend loaded");

// ── 4. Combined HTTP server ────────────────────────────────────────
const RENDER_PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  const url = req.url || "/";

  // Route API and health requests to Express
  if (url.startsWith("/api/") || url === "/health") {
    backendApp(req, res);
    return;
  }

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
