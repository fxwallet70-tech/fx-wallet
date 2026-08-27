const mongoose = require('mongoose');

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('FATAL: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.name, '-', error.message);
    console.error(error.stack);

    process.exit(1);
  }
};

module.exports = connectDatabase;