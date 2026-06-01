# TheZuriXperience — Integrated Payment & Ticketing Backend

This directory houses the highly scalable Node.js + Express.js backend for Safaricom Daraja M-Pesa payments, sequential ticketing sequence, professional PDF generation, and custom Nodemailer notifications.

---

## 📂 Backend Architecture

```
backend/
  ├── config/
  │    └── db.js               # Supabase admin initialization client
  ├── controllers/
  │    ├── paymentController.js# STK push, callbacks, status short polling
  │    └── ticketController.js # Gated ticket verification
  ├── routes/
  │    ├── paymentRoutes.js    # Routes for /api/payments
  │    └── ticketRoutes.js     # Routes for /api/tickets
  ├── services/
  │    ├── mpesaService.js     # Safaricom Daraja API integrations
  │    ├── pdfService.js       # Bespoke PDF Kit ticket compiler
  │    └── emailService.js     # Custom HTML email attachments
  ├── middleware/
  │    └── errorMiddleware.js  # GlobalExpress exception handlers
  ├── utils/
  │    └── validators.js       # Mobile phone format validation helpers
  ├── templates/
  │    └── emailTemplate.js    # Standard visual layouts
  ├── app.js                   # Server bootstrap script
  ├── package.json             # Service packages list
  └── .env.example             # Configuration templates
```

---

## ⚡ Setup & Installation

### 1. Install Dependencies
Run the following inside the `backend` folder:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
Fill in the variables in your `.env` file:
* **SUPABASE_URL** & **SUPABASE_SERVICE_ROLE_KEY**: Obtain from your Supabase Dashboard under Project Settings > API. Ensure you use the **service_role** key so that the backend has administrative rights to bypass Row Level Security policies (upload PDF tickets and write payment details).
* **Daraja API credentials**: Obtain sandbox/production consumer keys and secrets from the Safaricom Developer Portal. Set the callback URL to the public URL pointing to your backend endpoint (e.g. `https://yourdomain.com/api/payments/callback`).
* **Email credentials**: Setup Gmail App Passwords (if using Gmail SMTP) or input your Resend API token.

### 3. Setup Supabase Database
Execute the SQL migration scripts located in your `supabase/migrations/20260529220000_mpesa_ticketing.sql` file via the **Supabase SQL Editor** to create the necessary tables (`users`, `events`, `payments`), add linkage columns (`pdf_url`, `event_id`, `payment_id`, `used`), and initialize the `zuri_ticket_code_seq` sequences.

### 4. Create Supabase Storage Bucket
1. Open the Supabase Dashboard.
2. Navigate to **Storage** and click **New Bucket**.
3. Create a bucket named strictly: **`tickets`**.
4. Set its access control to **`Public`** so that the backend can generate downloadable, shareable PDF links for email attachments and ticket display.

---

## 🚀 Running the Server

### Development mode (with hot reloading):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```
The server will boot by default on port `5000` (e.g., `http://localhost:5000`).

---

## 📡 API Reference Endpoints

### 1. Initiate STK Push Payment
* **Route**: `POST /api/payments/stkpush`
* **Body**:
  ```json
  {
    "email": "customer@gmail.com",
    "phone": "0712345678",
    "amount": 2500,
    "tierName": "General",
    "quantity": 1,
    "eventVol": "01",
    "userId": "uuid-from-auth-context",
    "customerName": "Alvin Nderitu",
    "eventTitle": "RnB Nights (Vol. 01)",
    "eventDate": "Saturday, December 14"
  }
  ```

### 2. Poll Checkout Status
* **Route**: `GET /api/payments/status/:checkoutRequestId`
* **Response**:
  * **Pending**: `{ "success": true, "status": "PENDING" }`
  * **Failed**: `{ "success": true, "status": "FAILED", "message": "..." }`
  * **Completed**: 
    ```json
    {
      "success": true,
      "status": "COMPLETED",
      "ticket": {
        "code": "ZURI002",
        "pdfUrl": "https://...",
        "number": 2
      }
    }
    ```

### 3. Verify Concert Ticket Code
* **Route**: `GET /api/tickets/verify/:ticketCode`
* **Query Parameters**: `?markUsed=true` (marks the ticket as scanned and invalid for reuse).
* **Response**:
  ```json
  {
    "success": true,
    "valid": true,
    "status": "UNUSED",
    "message": "...",
    "ticket": {
      "code": "ZURI002",
      "tierName": "General",
      "quantity": 1,
      "eventTitle": "RnB Nights (Vol. 01)",
      "email": "customer@gmail.com"
    }
  }
  ```

---

## 🌐 Production Deployment

### 1. Deploying on Render / Heroku
1. Push your repository to GitHub.
2. Connect your repository to your Render/Heroku dashboard.
3. Configure the Root Directory setting to **`backend`** (if deploying from a monorepo) or deploy as a standalone service.
4. Input all the environment variables from your local `.env` file into your host's **Environment Settings** dashboard.
5. Setup the start command to: `npm start`.

### 2. Configure Callback URL
Ensure that your Safaricom developer account's callback URL matches your live production domain (e.g. `https://your-app-backend.onrender.com/api/payments/callback`). Safaricom requires standard HTTPS ports (`443`) for production callback triggers.
