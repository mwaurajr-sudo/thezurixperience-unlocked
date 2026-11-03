# TheZuriXperience — RSVP & Ticketing Backend

Node.js + Express backend for guest RSVPs, ticket issuing, PDF passes and email delivery.

## How an RSVP works

1. A guest enters their email on the RSVP tab: `POST /api/rsvp`.
2. They get an email from the **RSVP sender** (`EMAIL_*`) with a link to `/rsvp/confirm`.
3. They press **Confirm Attendance** on that page: `POST /api/rsvp/confirm`.
4. A ticket is issued and emailed with its PDF from the **ticket sender** (`TICKET_EMAIL_*`).

Codes count down from `ZURI099` to `ZURI001`; after that, confirmations are refused. RSVPing again with the same email sends a new confirmation link, or re-sends the ticket if one was already issued. Admins see RSVPs under **Tickets & RSVPs**.

## Backend Architecture

```
backend/
  ├── config/
  │    ├── db.js               # Supabase admin client
  │    └── event.js            # Current event and tiers from site_content
  ├── controllers/
  │    ├── rsvpController.js   # RSVP and attendance confirmation
  │    └── ticketController.js # Ticket verification
  ├── routes/
  │    ├── rsvpRoutes.js       # Routes for /api/rsvp
  │    └── ticketRoutes.js     # Routes for /api/tickets
  ├── services/
  │    ├── ticketService.js    # Code allocation and ticket delivery
  │    ├── pdfService.js       # PDF ticket generation
  │    └── emailService.js     # RSVP and ticket emails, one sender each
  ├── middleware/
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

Fill in `.env` with two separate mail accounts. For Gmail, turn on 2-Step Verification on each account and create an [app password](https://myaccount.google.com/apppasswords) for each. Set `PUBLIC_SITE_URL` to the site's address, because confirmation links are built from it.

The ticket sender has no fallback: if `TICKET_EMAIL_*` is missing, the ticket is still issued and shown on the confirm page, but the email fails and is retried when the guest opens their link again.

### Database

Apply `supabase/migrations/20261103120000_rsvp_confirmation.sql` before running this version.

`supabase/manual/drop_payments.sql` removes the old payment table and columns. It permanently deletes payment records, so it is not an automatic migration. The app works with or without it.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/rsvp` | Body `{ email, customerName, tierName, quantity }`. Sends the confirmation email. |
| POST | `/api/rsvp/confirm` | Body `{ token }`. Issues and emails the ticket. Safe to repeat. |
| GET | `/api/tickets/verify/:ticketCode` | Checks a ticket. `?markUsed=true` checks it in. |
| GET | `/api/tickets/pass/:ticketCode` | Downloads the PDF pass. |
| GET | `/health` | Health check. |
