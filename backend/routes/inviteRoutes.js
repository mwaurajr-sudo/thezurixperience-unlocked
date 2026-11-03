import express from "express";
import { sendInvites } from "../controllers/inviteController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route for admins to email event invites
// POST /api/invites
router.post("/", requireAdmin, sendInvites);

export default router;
