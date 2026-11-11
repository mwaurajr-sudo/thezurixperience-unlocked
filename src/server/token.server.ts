// Confirmation-link tokens. Only a SHA-256 hash is stored, matching the hashes the old
// Node backend wrote (hex of sha256), so links emailed before the move still work.

/** A random 32-byte token, base64url-encoded like the old backend's tokens. */
export const newToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
