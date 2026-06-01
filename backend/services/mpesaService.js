import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const getEnv = (key, fallback) => process.env[key] || fallback;

// Configure Daraja URL endpoints based on environment
const getMpesaBaseUrl = () => {
  const env = getEnv("MPESA_ENVIRONMENT", "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
};

/**
 * Generates Safaricom OAuth token
 * @returns {Promise<string>} Access token
 */
export const getOAuthToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Missing M-Pesa Consumer Key or Consumer Secret in environment variables.");
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("M-Pesa OAuth Generation Failure:", error.response?.data || error.message);
    throw new Error(`Failed to generate M-Pesa OAuth token: ${error.message}`);
  }
};

/**
 * Generates M-Pesa STK Push Signature parameters
 * @returns {Object} { password, timestamp }
 */
export const generatePasswordAndTimestamp = () => {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  if (!shortcode || !passkey) {
    throw new Error("Missing M-Pesa Shortcode or Passkey in environment variables.");
  }

  const date = new Date();
  const formatComponent = (num) => String(num).padStart(2, "0");
  const timestamp =
    date.getFullYear() +
    formatComponent(date.getMonth() + 1) +
    formatComponent(date.getDate()) +
    formatComponent(date.getHours()) +
    formatComponent(date.getMinutes()) +
    formatComponent(date.getSeconds());

  const rawPassword = shortcode + passkey + timestamp;
  const password = Buffer.from(rawPassword).toString("base64");

  return { password, timestamp };
};

/**
 * Initiates an STK Push (Lipa Na M-Pesa Online) payment transaction.
 *
 * @param {string} phone - Target formatted Kenyan mobile number (e.g. 254712345678)
 * @param {number} amount - Total billing amount in KES
 * @param {string} reference - Billing account identifier (e.g., ticket category/volume)
 * @returns {Promise<Object>} Safaricom transaction response
 */
export const initiateSTKPush = async (phone, amount, reference = "TheZuriXperience") => {
  try {
    const token = await getOAuthToken();
    const { password, timestamp } = generatePasswordAndTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!shortcode || !callbackUrl) {
      throw new Error("Missing shortcode or callback URL config.");
    }

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: reference.replace(/\s+/g, ""),
      TransactionDesc: `Concert Ticket Payment`,
    };

    const url = `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`;
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("STK Push Payment Trigger Failure:", error.response?.data || error.message);
    throw new Error(error.response?.data?.errorMessage || error.message);
  }
};

/**
 * Parses and decodes Lipa Na M-Pesa callback body details
 *
 * @param {Object} callbackBody - Raw callback payload from Safaricom
 * @returns {Object} Decoded transaction parameters: { success, checkoutRequestId, receipt, amount, phone, message }
 */
export const parseCallbackData = (callbackBody) => {
  if (!callbackBody || !callbackBody.Body || !callbackBody.Body.stkCallback) {
    throw new Error("Invalid callback structure received.");
  }

  const callback = callbackBody.Body.stkCallback;
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;

  const result = {
    success: ResultCode === 0,
    checkoutRequestId: CheckoutRequestID,
    merchantRequestId: MerchantRequestID,
    message: ResultDesc,
    receipt: null,
    amount: null,
    phone: null,
  };

  if (result.success && callback.CallbackMetadata && callback.CallbackMetadata.Item) {
    const items = callback.CallbackMetadata.Item;
    
    const findValue = (name) => {
      const found = items.find((item) => item.Name === name);
      return found ? found.Value : null;
    };

    result.receipt = findValue("MpesaReceiptNumber");
    result.amount = findValue("Amount");
    result.phone = findValue("PhoneNumber");
  }

  return result;
};
