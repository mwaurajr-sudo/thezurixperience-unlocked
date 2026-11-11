# Deploying TheZuriXperience on Cloudflare

The whole site — pages and API (`src/routes/api`) — runs as one Cloudflare Worker.
DJ-set recordings live in a Cloudflare R2 bucket, because Workers can't serve files over 25 MB.
Email goes out through Resend. The database and sign-in stay on Supabase.

Do these once, in this order.

## 1. Domain
1. Buy the `.co.ke` from a KENIC-accredited registrar (Cloudflare doesn't sell `.ke` names).
2. In Cloudflare: **Add a domain** → enter it → choose the **Free** plan.
3. Cloudflare shows two nameservers. At your registrar, replace the domain's nameservers with those two.
   It can take a few hours before Cloudflare says the domain is active.

## 2. Recordings (R2)
1. Cloudflare → **R2** → create a bucket, e.g. `zuri-media`.
2. Open the bucket → **Upload** → create a folder `recordings` and upload the two `.m4a` files
   from `Desktop\zuri\recordings-for-r2`.
3. Bucket **Settings** → **Custom Domains** → add `media.<your domain>` (e.g. `media.thezurixperience.co.ke`).
   That address is your `VITE_MEDIA_URL`.

## 3. Email (Resend)
1. Sign up at resend.com → **Domains** → add your domain.
2. Resend lists DNS records. Add each one in Cloudflare → your domain → **DNS** (or let Resend add them
   automatically with its Cloudflare button).
3. When the domain shows **Verified**, go to **API Keys** → create one with "Sending access". Copy it once.

## 4. The site (Workers)
1. Cloudflare → **Workers & Pages** → **Create** → **Import a repository** → connect GitHub and pick
   `thezurixperience-unlocked`, branch `main`.
2. Build settings:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Build variable: `VITE_MEDIA_URL` = `https://media.<your domain>`
3. After the first deploy, open the Worker → **Settings** → **Variables and Secrets** and add:

   | Name | Type | Value |
   |---|---|---|
   | `SUPABASE_URL` | Text | Supabase project URL (same as in `.env.production`) |
   | `SUPABASE_PUBLISHABLE_KEY` | Text | Supabase publishable key (same as in `.env.production`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → Project Settings → API → service_role key |
   | `RESEND_API_KEY` | **Secret** | the Resend key from step 3 |
   | `EMAIL_FROM` | Text | e.g. `tickets@<your domain>` (RSVP and ticket emails) |
   | `INVITE_EMAIL_FROM` | Text | optional, e.g. `invites@<your domain>` (defaults to `EMAIL_FROM`) |
   | `REPLY_TO` | Text | optional, where guests' replies go |
   | `PUBLIC_SITE_URL` | Text | `https://<your domain>` (used in email links) |

4. Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → your domain
   (and `www.<your domain>` if you want it).

## 5. Supabase
Supabase → **Authentication** → **URL Configuration**: set **Site URL** to `https://<your domain>` and add
it to **Redirect URLs**, so sign-in links point at the new site.

## 6. Recommended: a rate limit on the API
Cloudflare → your domain → **Security** → **WAF** → **Rate limiting rules** → create one:
when URI Path starts with `/api/`, more than 30 requests in 10 seconds from one IP → Block.
(The API also slows repeated guesses itself, but this is the firm limit.)

## 7. Switch off Render
Once the new address works, delete the service in the Render dashboard.

## Switches in the code
- RSVPs: `src/lib/rsvp-status.ts` (`RSVP_PAUSED`). Pausing hides the page and the API refuses new RSVPs.
- Emailed confirmation step: set the variable `REQUIRE_EMAIL_CONFIRMATION` to `true`.
- Recordings list: `src/lib/recordings.ts`. Gallery: `src/lib/gallery.ts`.
