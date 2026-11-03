/**
 * Validates basic email formatting
 *
 * @param {string} email - Input email
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
  return re.test(String(email).trim().toLowerCase());
};
