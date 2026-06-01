import express from "express";
import { stkPush, callback, getStatus } from "../controllers/paymentController.js";

const router = express.Router();

// Route to initiate an M-Pesa STK Push
// POST /api/payments/stkpush
router.post("/stkpush", stkPush);

// Route for Safaricom Daraja API callbacks (Lipa Na M-Pesa Online results)
// Safaricom will send a POST request to this endpoint once the user completes or cancels the payment.
// Note: This endpoint must remain public (no auth gates) to receive incoming Safaricom signals.
// POST /api/payments/callback
router.post("/callback", callback);

// Route for frontend status polling using CheckoutRequestID
// GET /api/payments/status/:checkoutRequestId
router.get("/status/:checkoutRequestId", getStatus);

export default router;
