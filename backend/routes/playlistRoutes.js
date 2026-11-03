import express from "express";
import rateLimit from "express-rate-limit";
import { unlockPlaylist } from "../controllers/playlistController.js";

const router = express.Router();

// Only wrong codes count, so guests reopening the page aren't locked out while guessing is slowed.
const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

// Route to check the access code and return the tracklist
// POST /api/playlist/unlock
router.post("/unlock", unlockLimiter, unlockPlaylist);

export default router;
