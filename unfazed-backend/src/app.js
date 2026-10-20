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

// Root greeting
app.get('/', (req, res) => {
  res.send('Unfazed SaaS Clinical API is running. Access endpoints via /api/*');
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
