const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('MONGO_URI is missing. Server started without database connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: uri.includes('/eventsphere') ? undefined : 'eventsphere'
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
};

module.exports = connectDB;

