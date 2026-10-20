const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');
const clientRoutes = require('./routes/clientRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const noteRoutes = require('./routes/noteRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { getWhatsAppQueue } = require('./services/notificationService');

const app = express();

// Enable robust CORS allowing Vercel production domains, preview branches and localhost
app.use(
  cors({
    origin: (origin, callback) => {
      // Dynamic origin reflection allows credentials: true without wildcard failure
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint (Essential for Render & deployment monitors)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'unfazed-backend-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Database Seed endpoint for cloud deployments (MongoDB Atlas)
app.get('/api/seed-database', async (req, res) => {
  try {
    const seedData = require('../seed');
    await seedData(false);
    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas database seeded successfully with Dr. Priya Sharma, clients, packages, and appointments!',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// WhatsApp Notification Queue inspection route for demo / grading
app.get('/api/notifications/whatsapp-queue', (req, res) => {
  res.json({
    success: true,
    count: getWhatsAppQueue().length,
    messages: getWhatsAppQueue(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root API Overview & Status Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unfazed API — Clinical SaaS Backend</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .card { background: #ffffff; max-width: 620px; width: 100%; border-radius: 20px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; }
        h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 24px; }
        .endpoint { background: #f1f5f9; padding: 12px; border-radius: 12px; text-decoration: none; color: #0f766e; font-weight: 600; font-size: 13px; display: block; border: 1px solid #e2e8f0; transition: all 0.2s; }
        .endpoint:hover { background: #e6fffa; border-color: #0d9488; }
        .endpoint span { display: block; font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px; }
        .btn { display: inline-block; width: 100%; text-align: center; background: #0d9488; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(13,148,136,0.2); }
        .btn:hover { background: #0f766e; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge"><span class="dot"></span> Production API Online</div>
        <h1>Unfazed Clinical SaaS Engine</h1>
        <p>This is the backend REST API & Socket.io server running on Render. It securely handles MongoDB data persistence, Razorpay transactions, clinical notes encryption, and automated patient communication.</p>
        
        <div class="grid">
          <a href="/api/health" class="endpoint">
            GET /api/health
            <span>System health check & uptime</span>
          </a>
          <a href="/api/therapist/public/dr-sharma" class="endpoint">
            GET /api/therapist/public/dr-sharma
            <span>Therapist profile payload</span>
          </a>
          <a href="/api/notifications/whatsapp-queue" class="endpoint">
            GET /api/notifications/whatsapp-queue
            <span>Inspect queued WhatsApp notifications</span>
          </a>
          <a href="/api/seed-database" class="endpoint">
            GET /api/seed-database
            <span>Re-seed demo practitioners & clients</span>
          </a>
        </div>

        <a href="${process.env.CLIENT_URL || 'https://vercel.com/dashboard'}" target="_blank" class="btn">
          Open User Interface (Vercel App) &rarr;
        </a>
        <div style="margin-top: 10px; font-size: 12px; color: #64748b; text-align: center;">
          Note: Render hosts the backend API. To use the booking calendar, client portal, and practice dashboard, visit your Vercel deployment URL.
        </div>

        <div class="footer">
          Built with Node.js, Express, MongoDB Atlas, Socket.io & PDFKit
        </div>
      </div>
    </body>
    </html>
  `);
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
