const http = require('http');
const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { Server } = require('socket.io');
const setupChatSocket = require('./src/sockets/chatSocket');

// Connect to MongoDB & Auto-seed if database is brand new
connectDB().then(async () => {
  try {
    const Therapist = require('./src/models/Therapist');
    const count = await Therapist.countDocuments();
    if (count === 0) {
      console.log('[Auto-Seed] Database is empty. Auto-seeding initial demo practitioners...');
      const seedData = require('./seed');
      await seedData(false);
      console.log('[Auto-Seed] Auto-seeding complete.');
    }
  } catch (err) {
    console.warn('[Auto-Seed] Warning:', err.message);
  }
});

const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup chat socket handlers
setupChatSocket(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Unfazed API Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Socket.io Real-Time Chat Engine ready`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
