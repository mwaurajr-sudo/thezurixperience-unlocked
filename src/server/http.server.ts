// Shared helpers for the /api routes, which run on the server only (Cloudflare Workers).
import { db } from "./db.server";

/** An error whose message is safe to show the visitor, with the HTTP status to send. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

/**
 * Wraps a route handler so thrown errors become JSON replies: an HttpError keeps its
 * status and message, anything else is logged and reported as a generic failure.
 */
export const handle =
  <C extends { request: Request }>(fn: (ctx: C) => Promise<Response>) =>
  async (ctx: C): Promise<Response> => {
    try {
      return await fn(ctx);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ success: false, message: error.message }, error.status);
      }
      console.error(`API error on ${new URL(ctx.request.url).pathname}:`, error);
      return json({ success: false, message: "Something went wrong. Please try again." }, 500);
    }
  };

/** Reads a JSON body, treating a missing or malformed one as empty. */
export const readJson = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const clientIp = (request: Request) =>
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

// Counts per visitor, kept in this server instance's memory. Cloudflare runs several
// instances, so this slows guessing and spamming rather than stopping it outright;
// a Cloudflare rate-limiting rule on /api/* is the firmer limit.
const buckets = new Map<string, { count: number; resetAt: number }>();

const bucketFor = (request: Request, name: string, windowMs: number) => {
  const key = `${name}:${clientIp(request)}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > 10_000) buckets.clear();
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  return bucket;
};

/** True once this visitor has used up `limit` attempts in the window. */
export const isRateLimited = (request: Request, name: string, limit: number, windowMs: number) =>
  bucketFor(request, name, windowMs).count >= limit;

/** Counts one attempt against the visitor's limit. */
export const countAttempt = (request: Request, name: string, windowMs: number) => {
  bucketFor(request, name, windowMs).count += 1;
};

const bearerToken = (request: Request) =>
  request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;

/** The signed-in user from the Supabase session sent as a bearer token, if any. */
export const userFrom = async (request: Request): Promise<{ id: string; email: string | null } | null> => {
  const token = bearerToken(request);
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: (data.user as { email?: string | null }).email ?? null };
};

/** The signed-in user's id, if any. */
export const userIdFrom = async (request: Request): Promise<string | null> => (await userFrom(request))?.id ?? null;

/** Lets only signed-in admins through; throws 401/403 otherwise. Returns the admin. */
export const requireAdmin = async (request: Request) => {
  const user = await userFrom(request);
  if (!user) throw new HttpError(401, "Please sign in.");

  const { data: role, error } = await db()
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  if (!role) throw new HttpError(403, "Admins only.");
  return user;
};

export const validateEmail = (email: unknown) =>
  typeof email === "string" && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email.trim().toLowerCase());
