import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load configuration
dotenv.config();

// Imports error handlers
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

// Import router files
import inviteRoutes from "./routes/inviteRoutes.js";
import playlistRoutes from "./routes/playlistRoutes.js";
import rsvpRoutes from "./routes/rsvpRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

const app = express();

// Render and Vercel sit one proxy in front of us; rate limiting needs the real client IP
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temp uploads directory for PDF generation if not exists
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // Directory might be read-only in serverless/container environments
}

// Config CORS
const rawFrontendUrls = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""));

const allowedOrigins = new Set([
  ...rawFrontendUrls,
  // The site's own address: browsers send it as the origin on POST requests, even from the same site
  ...[process.env.PUBLIC_SITE_URL, process.env.RENDER_EXTERNAL_URL]
    .filter(Boolean)
    .map((url) => url.trim().replace(/\/$/, "")),
  "https://thezurixperience-unlocked.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin or matching allowed domains (including Vercel preview deployments)
      if (
        !origin ||
        allowedOrigins.has(origin.replace(/\/$/, "")) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error(`CORS Policy Violation: Origin ${origin} is not allowed.`));
      }
    },
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("dev"));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic routes registration
app.use("/api/invites", inviteRoutes);
app.use("/api/playlist", playlistRoutes);
app.use("/api/rsvp", rsvpRoutes);
app.use("/api/tickets", ticketRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Error handling Fallbacks
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`TheZuriXperience Backend running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
}

export default app;
