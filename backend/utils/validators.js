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
