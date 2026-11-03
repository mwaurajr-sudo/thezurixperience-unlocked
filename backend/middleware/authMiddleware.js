import { supabase } from "../config/db.js";

// Only lets signed-in admins through, using the Supabase session sent as a bearer token.
export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ success: false, message: "Please sign in." });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ success: false, message: "Please sign in." });
    }

    const { data: role, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr) throw roleErr;
    if (!role) {
      return res.status(403).json({ success: false, message: "Admins only." });
    }

    next();
  } catch (error) {
    console.error("Admin Check Error:", error.message);
    next(error);
  }
};
