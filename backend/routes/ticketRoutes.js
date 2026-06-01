import express from "express";
import { verifyTicket } from "../controllers/ticketController.js";

const router = express.Router();

// Route to verify ticket validity and usage status
// Can accept query parameter ?markUsed=true to check-in the ticket.
// GET /api/tickets/verify/:ticketCode
router.get("/verify/:ticketCode", verifyTicket);

// Optional POST endpoint for verification
// POST /api/tickets/verify/:ticketCode
router.post("/verify/:ticketCode", verifyTicket);

export default router;
