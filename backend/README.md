# TheZuriXperience — RSVP & Ticketing Backend

Node.js + Express backend for guest RSVPs, ticket issuing, PDF passes and email delivery.

## How an RSVP works

1. An admin pastes guest emails under **Tickets & RSVPs** and sends invites: `POST /api/invites`. They go out from the **invite sender** (`INVITE_EMAIL_*`) with the RSVP link and instructions.
2. The guest enters their email on the public `/rsvp` page, with no account needed: `POST /api/rsvp`.
3. They automatically get an email from the **main sender** (`EMAIL_*`) with a link to `/rsvp/confirm`.
4. They press **Confirm Attendance**: `POST /api/rsvp/confirm`.
5. A ticket is issued and automatically emailed with its PDF from the main sender.

Codes count down from `ZURI099` to `ZURI001`; after that, confirmations are refused. RSVPing again with the same email sends a new confirmation link, or re-sends the ticket if one was already issued. Admins see RSVPs under **Tickets & RSVPs**.

## Backend Architecture

```
backend/
  ├── config/
  │    ├── db.js               # Supabase admin client
  │    └── event.js            # Current event and tiers from site_content
  ├── controllers/
  │    ├── inviteController.js # Event invites
  │    ├── rsvpController.js   # RSVP and attendance confirmation
  │    └── ticketController.js # Ticket verification
  ├── routes/
  │    ├── inviteRoutes.js     # Routes for /api/invites
  │    ├── rsvpRoutes.js       # Routes for /api/rsvp
  │    └── ticketRoutes.js     # Routes for /api/tickets
  ├── services/
  │    ├── ticketService.js    # Code allocation and ticket delivery
  │    ├── pdfService.js       # PDF ticket generation
  │    └── emailService.js     # Invite, RSVP and ticket emails
  ├── middleware/
  │    ├── authMiddleware.js   # Admin check
  │    └── errorMiddleware.js  # Express exception handlers
  ├── utils/
  │    └── validators.js       # Email validation
  └── app.js                   # Server bootstrap
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Fill in `.env` with two separate mail accounts: the main sender and the invite sender. For Gmail, turn on 2-Step Verification on each account and create an [app password](https://myaccount.google.com/apppasswords) for each. Set `PUBLIC_SITE_URL` to the site's address, because confirmation links are built from it.

All emails show "Zuri" as the sender name. The invite sender has no fallback: if `INVITE_EMAIL_*` is missing, invites fail and are listed as failed. If a ticket email fails, the ticket is still shown on the confirm page, and the email is retried when the guest opens their link again.

### Database

Apply `supabase/migrations/20261103120000_rsvp_confirmation.sql` and `20261103130000_event_invites.sql` before running this version.

`supabase/manual/drop_payments.sql` removes the old payment table and columns. It permanently deletes payment records, so it is not an automatic migration. The app works with or without it.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/invites` | Admin only. Body `{ guests: [{ email, name }], resend }`, up to 25 guests. Emails the event invite. |
| GET | `/api/rsvp/availability` | How many passes are left. |
| POST | `/api/rsvp` | Body `{ email, customerName, tierName }`. Sends the confirmation email. |
| POST | `/api/rsvp/confirm` | Body `{ token }`. Issues and emails the ticket. Safe to repeat. |
| GET | `/api/tickets/verify/:ticketCode` | Checks a ticket. `?markUsed=true` checks it in. |
| GET | `/api/tickets/pass/:ticketCode` | Downloads the PDF pass. |
| GET | `/health` | Health check. |
