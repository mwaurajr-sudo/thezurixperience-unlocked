import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Response("Failed to verify admin", { status: 500 });
  if (!data) throw new Response("Forbidden: admin only", { status: 403 });
}

const searchSchema = z.object({
  query: z.string().trim().min(1).max(255),
});

export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const q = data.query.toLowerCase();

    // Page through auth users (admin API has no email filter on listUsers)
    const matches: Array<{ id: string; email: string; created_at: string }> = [];
    const perPage = 200;
    for (let page = 1; page <= 10 && matches.length < 25; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Response(error.message, { status: 500 });
      if (!list?.users?.length) break;

      for (const u of list.users) {
        if (u.email && u.email.toLowerCase().includes(q)) {
          matches.push({ id: u.id, email: u.email, created_at: u.created_at });
          if (matches.length >= 25) break;
        }
      }
      if (list.users.length < perPage) break;
    }

    if (matches.length === 0) return { users: [] };

    const ids = matches.map((m) => m.id);
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids);
    if (rolesErr) throw new Response(rolesErr.message, { status: 500 });

    const roleMap = new Map<string, Set<string>>();
    for (const r of roles ?? []) {
      if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, new Set());
      roleMap.get(r.user_id)!.add(r.role);
    }

    return {
      users: matches.map((m) => ({
        id: m.id,
        email: m.email,
        created_at: m.created_at,
        is_admin: roleMap.get(m.id)?.has("admin") ?? false,
      })),
    };
  });

const toggleSchema = z.object({
  userId: z.string().uuid(),
  makeAdmin: z.boolean(),
});

export const toggleAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => toggleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (!data.makeAdmin && data.userId === context.userId) {
      throw new Response("You cannot remove your own admin role.", { status: 400 });
    }

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && error.code !== "23505") {
        throw new Response(error.message, { status: 500 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Response(error.message, { status: 500 });
    }

    return { ok: true, is_admin: data.makeAdmin };
  });
