const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Don't crash immediately in dev/test if DB is not up yet, log warning
    console.warn('[Database] Note: Ensure MongoDB Atlas connection string or local MongoDB is active.');
  }
};

module.exports = connectDB;
