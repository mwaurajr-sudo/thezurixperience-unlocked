import crypto from "crypto";
import { tracklist } from "../data/tracklist.js";

// Guests may type the code in any case or with stray spaces.
const hashCode = (value) =>
  crypto.createHash("sha256").update(String(value ?? "").trim().toLowerCase()).digest();

/**
 * Returns the tracklist when the guest's code matches PLAYLIST_CODE.
 *
 * POST /api/playlist/unlock
 */
export const unlockPlaylist = (req, res) => {
  const expectedCode = process.env.PLAYLIST_CODE;
  if (!expectedCode?.trim()) {
    console.error("Playlist Error: PLAYLIST_CODE is not set.");
    return res.status(503).json({ success: false, message: "The playlist isn't available yet." });
  }

  if (!crypto.timingSafeEqual(hashCode(req.body?.code), hashCode(expectedCode))) {
    return res.status(401).json({ success: false, message: "That code isn't right." });
  }

  return res.status(200).json({ success: true, tracks: tracklist });
};
