const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[catalog-service] MongoDB (kitchen_db) connected');
  } catch (err) {
    console.error('[catalog-service] MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
