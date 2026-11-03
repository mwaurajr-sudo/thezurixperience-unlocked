import express from "express";
import rateLimit from "express-rate-limit";
import { createRsvp, confirmRsvp, getAvailability } from "../controllers/rsvpController.js";

const router = express.Router();

// This endpoint sends mail to any address typed into it, so it needs a ceiling per visitor
// to keep it from being used to spam people or burn through the sender's daily limit.
const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many RSVP attempts. Please try again later." },
});

// Route to read how many passes are left
// GET /api/rsvp/availability
router.get("/availability", getAvailability);

// Route to record an RSVP and email the confirmation link
// POST /api/rsvp
router.post("/", rsvpLimiter, createRsvp);

// Route to confirm attendance, which issues the ticket and emails it
// POST /api/rsvp/confirm
router.post("/confirm", confirmRsvp);

export default router;
