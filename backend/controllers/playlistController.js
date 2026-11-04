import { supabase } from "../config/db.js";
import { tracklist } from "../data/tracklist.js";

/**
 * Returns the tracklist when the guest enters the code from a real ticket.
 * Checked-in tickets still count, so guests keep the playlist after the event.
 *
 * POST /api/playlist/unlock
 */
export const unlockPlaylist = async (req, res, next) => {
  // Tickets read ZURI098, but guests may type zuri98 or ZURI 98.
  const cleanCode = String(req.body?.code ?? "")
    .trim()
    .toUpperCase()
    .replace(/^ZURI\s*0*(\d+)$/, (_, number) => `ZURI${number.padStart(3, "0")}`);

  try {
    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("id")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) throw error;

    if (!ticket) {
      return res.status(401).json({ success: false, message: "That ticket code isn't right." });
    }

    return res.status(200).json({ success: true, tracks: tracklist });
  } catch (error) {
    console.error("Playlist Unlock Error:", error.message);
    next(error);
  }
};
