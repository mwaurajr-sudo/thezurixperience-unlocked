/**
 * Validates and formats a Kenyan phone number to the Daraja compatible 12-digit format: 254XXXXXXXXX.
 * Accepts formats: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX, 7XXXXXXXX.
 *
 * @param {string} phone - Input phone number
 * @returns {string|null} Formatted phone number or null if invalid
 */
export const formatKenyanPhone = (phone) => {
  if (!phone) return null;

  // Strip all non-digit characters (spaces, +, dashes)
  let cleaned = phone.toString().replace(/\D/g, "");

  // Match 07XXXXXXXX or 01XXXXXXXX (10 digits) -> convert to 2547XXXXXXXX / 2541XXXXXXXX
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return "254" + cleaned.slice(1);
  }

  // Match 7XXXXXXXX or 1XXXXXXXX (9 digits) -> convert to 2547XXXXXXXX / 2541XXXXXXXX
  if (/^[17]\d{8}$/.test(cleaned)) {
    return "254" + cleaned;
  }

  // Match 2547XXXXXXXX or 2541XXXXXXXX (12 digits starting with 254) -> return as is
  if (/^254[17]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
};

/**
 * Validates basic email formatting
 *
 * @param {string} email - Input email
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^\S+@\S+\.\S+$/;
  return re.test(String(email).trim().toLowerCase());
};
