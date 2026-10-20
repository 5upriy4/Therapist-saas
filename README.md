# Unfazed — Clinical Practice Management SaaS for Therapists

> **Major Project — Web Development**  
> End-to-end SaaS platform for independent therapists and psychology practices in India to run client acquisition, timezone-aware scheduling, advance Razorpay payments, clinical SOAP/DAP documentation, real-time encrypted messaging, and centralized tier entitlement gating.

---

## 🌟 Executive Summary & System Architecture

Unfazed empowers mental health practitioners to run their private practice entirely through one branded link (`unfazed.in/:slug`, e.g. `/dr-sharma`).

```
+-----------------------------------------------------------+
|                          CLIENTS                          |
|                  (Browser / Mobile Web)                   |
+-----------------------------+-----------------------------+
                              | HTTPS
              +---------------+---------------+
              |                               |
      +-------v-------+               +-------v-------+
      | REACT CLIENT  |               | REACT CLIENT  |
      | Therapist Hub |               | Client Portal |
      +-------+-------+               +-------+-------+
              |                               |
              +---------------+---------------+
                              | REST API (Axios) + Socket.io
              +---------------v---------------+
              |     NODE.JS + EXPRESS API     |
              | Routes / Controllers / Sockets|
              +-------+---------------+-------+
                      |               |
              +-------v-------+ +-----v---------------------+
              |    MONGODB    | |    ENTITLEMENT SERVICE    |
              |  (Mongoose)   | |  (Single Source of Truth) |
              +-------+-------+ +---------------------------+
                      |
        +-------------+-------------+-------------+
        |                           |             |
+-------v-------+           +-------v------+ +----v-----------+
|   RAZORPAY    |           |  SOCKET.IO   | | NOTIFICATION   |
| Payments &    |           |  Live Chat   | | (Email/WhatsApp|
| GST Invoices  |           | & Receipts   | |  Event Queue)  |
+---------------+           +--------------+ +----------------+
```

### Architectural Principles Enforced:
1. **Centralized Entitlements (`canAccess`)**: No component or route checks raw subscription tier strings (e.g. `tier === 'starter'`). Feature gating is config-driven through `SubscriptionTierConfig`.
2. **Strict API-Layer Data Isolation**: Private clinical reflections are filtered and projected at the database level so private notes are **never** serialized to client-facing routes.
3. **No Hardcoded Caps**: All tier limits, monetary amounts, and session quotas are dynamic database configurations.
4. **Resilient Gateway Stubs**: Razorpay payments, GST invoice PDF generation, and WhatsApp notifications run out of the box in sandbox mode even without third-party production credentials.

---

## 📁 Repository Structure

```
unfazed/
├── unfazed-backend/                   # Express.js + Mongoose + Socket.io API
│   ├── src/
│   │   ├── config/                    # MongoDB connection & Razorpay client
│   │   ├── models/                    # 10 Mongoose schemas (Therapist, Client, Session, etc.)
│   │   ├── controllers/               # Auth, Therapist, Client, Scheduling, Payment, Note, Analytics
│   │   ├── routes/                    # Modular Express routes
│   │   ├── middleware/                # JWT Auth, Entitlement Gating & Error Handler
│   │   ├── services/                  # EntitlementService, InvoiceService, NotificationService
│   │   ├── sockets/                   # Socket.io chat handlers & typing indicators
│   │   ├── utils/                     # Slug generation with collision checks
│   │   └── app.js                     # Express app configuration & middleware
│   ├── server.js                      # HTTP & Socket.io server entry point
│   ├── seed.js                        # Complete realistic test dataset
│   ├── render.yaml                    # Render.com deployment configuration
│   ├── .env.example
│   └── package.json
│
├── unfazed-frontend/                  # React (Vite) + Tailwind CSS + Recharts SPA
│   ├── src/
│   │   ├── api/                       # Axios instance with 403 entitlement interceptor
│   │   ├── components/                # Modular UI components (common, profile, scheduling, crm, notes, chat, analytics)
│   │   ├── pages/                     # Therapist dashboard, CRM, schedule, notes, analytics & Client portal
│   │   ├── context/                   # AuthContext with therapist & client state
│   │   ├── hooks/                     # useEntitlement custom hook
│   │   ├── routes/                    # Protected & public routing
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json                    # Vercel SPA routing rewrites
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
└── README.md                          # Master documentation & deployment guide
```

---

## 🚀 Module-by-Module Feature Breakdown

### Module 1: Foundations — Auth, Profile & the Branded Link
- **Therapist Schema & Model**: Secure bcrypt password hashing, unique slug validation (`generateUniqueSlug`), RCI registration, credentials, languages, and pricing.
- **Branded Profile (`/:slug`)**: Hero section, credentials badge, clinical philosophy, specializations tags, and prospective client lead capture modal.
- **Open Graph Ready**: Shareable profile meta tags for WhatsApp and LinkedIn.

### Module 2: Scheduling System across Timezones
- **Availability Schema**: Recurring weekly schedules, custom session durations (30, 45, 50, 60, 90 mins), and inter-session decompression buffer times (0–30 mins).
- **Client Slot Picker**: Automatically detects client's local browser timezone (e.g. `America/New_York`, `Asia/Kolkata`) and converts availability seamlessly.
- **Atomic Double-Booking Prevention**: Validates overlapping session intervals before booking.
- **Waitlist Engine**: Allows clients to join a waitlist when dates are fully booked with automatic notification dispatch upon cancellations.

### Module 3: Client CRM & Intake
- **Client Caseload CRM**: Sortable, filterable client table with search by name, email, or phone.
- **Comprehensive Profile Modal**: Aggregates complete appointment history, billing invoices, and clinical notes for any client.
- **Intake Form & Auditable Consent**: Captures demographics, presenting concerns, medical/mental health history, plus an auditable **Digital Consent Record** with IP address and timestamp.

### Module 4: Payments & Packages
- **Razorpay Integration**: Advance payment capture at booking time with simulated sandbox fallback.
- **GST-Compliant Tax Invoices**: Auto-generates authentic Indian Tax Invoices (SAC 999312 - Healthcare & Psychological services) using `pdfkit` complete with CGST/SGST breakdown.
- **Session Packages**: 3-session, 6-session, and 12-session discounted bundles with per-session tracking and validity expiration dates.
- **Webhook Handler**: Cryptographically verified HMAC SHA-256 signature verification for asynchronous payment capture.

### Module 5: Clinical Documentation
- **Role-Restricted Data Access**:
  - `private` notes: Strictly isolated to therapist.
  - `shared` notes: Synchronized to the client portal for between-session reflection.
  - Hard API-layer guarantee: The client portal route strictly filters `{ type: 'shared' }` and will **never** return private therapist reflections.
- **Template Suite**: Freeform rich text editor, structured **SOAP** (Subjective, Objective, Assessment, Plan), and **DAP** (Data, Assessment, Plan) templates.

### Module 6: Communication Layer
- **Socket.io Live Chat**: In-app real-time encrypted messaging between therapist and client with typing indicators and read receipts.
- **Event-Driven Notification Architecture**: Fires on booking confirmation, 24hr reminder, and payment receipts.
- **WhatsApp API Stub & Queue**: Dispatches structured WhatsApp template messages to an inspectable queue (`/api/notifications/whatsapp-queue`).
- **Nodemailer**: Dispatches formatted HTML confirmation emails.

### Module 7: Subscription Tiers, Entitlements & Analytics
- **Config-Driven Tiers**:
  - **Starter**: 5 active clients, Freeform notes, Basic analytics.
  - **Growth**: 25 active clients, SOAP templates, Advanced analytics, Multi-session packages.
  - **Practice**: Unlimited clients, DAP + SOAP suite, Custom branding, Advanced analytics.
- **Centralized Entitlement Service (`canAccess`)**: Central single source of truth for feature access.
- **Upgrade Prompt Modal**: Automatically surfaces when a user attempts a gated action (such as exceeding active client caps or selecting SOAP templates on Starter).
- **MongoDB Aggregation Analytics**:
  - Monthly gross revenue trend (`$group` by month with `$sum` and `$avg`).
  - No-show rate calculation directly within database pipelines.
  - Session adherence breakdown (Completed vs. Confirmed vs. No-show vs. Cancelled).
  - Weekday appointment volume distribution.

---

## 🔑 Pre-Seeded Demo Accounts

To test all modules without manual entry, run the database seed script:

```bash
cd unfazed-backend
npm run seed
```

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Therapist (Growth Plan)** | `dr.sharma@unfazed.in` | `password123` | Dr. Priya Sharma (`/dr-sharma`) — SOAP notes & packages unlocked |
| **Therapist (Starter Plan)** | `dr.verma@unfazed.in` | `password123` | Dr. Rohan Verma (`/rohan-verma`) — Demonstrates tier gating & upgrade modal |
| **Client** | `aarav.mehta@example.com` | *(Portal Login)* | Has intake, signed consent, past sessions & shared homework notes |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js v18+ and npm installed
- MongoDB installed locally OR a free MongoDB Atlas connection string

### 1. Backend Setup
```bash
cd unfazed-backend
npm install
npm run seed     # Populate realistic practitioners, appointments, and invoices
npm run dev      # Starts API on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd unfazed-frontend
npm install
npm run dev      # Starts Vite React client on http://localhost:5173
```

Visit `http://localhost:5173/dr-sharma` to view the public profile or `http://localhost:5173/login` for the therapist practice hub.

---

## 🌐 Production Deployment Guide

### A. Hosting the Backend on Render (render.com)

1. Create a free account on [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following build settings:
   - **Root Directory**: `unfazed-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_random_32_character_jwt_secret`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` (your Vercel frontend domain)
   - `RAZORPAY_KEY_ID`: `your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET`: `your_razorpay_key_secret`
6. Click **Deploy Web Service**. Render will generate a URL like `https://unfazed-backend.onrender.com`.

---

### B. Hosting the Frontend on Vercel (vercel.com)

1. Create a free account on [Vercel](https://vercel.com).
2. Click **Add New...** → **Project** and import your repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `unfazed-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-app.onrender.com`
   - `VITE_RAZORPAY_KEY_ID`: `your_razorpay_key_id`
5. Click **Deploy**. Vercel will build the SPA and provide a live URL like `https://unfazed-frontend.vercel.app`.
6. *(Important)* Copy your Vercel URL back into Render's `CLIENT_URL` environment variable to ensure CORS and Socket.io handshake permissions are granted.

---

## 🛡️ License & Academic Integrity
Built for the **UNLOX Major Project — Web Development Program**. All clinical schemas adhere to the compliance directives of the Mental Healthcare Act, 2017.
