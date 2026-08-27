const mongoose = require('mongoose');

const maskPassword = (uri) => {
  return uri.replace(/:([^@]+)@/, ':****@');
};

const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('FATAL: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  const maskedUri = maskPassword(process.env.MONGODB_URI);
  console.log('Attempting MongoDB connection to:', maskedUri);

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.name, '-', error.message);
    console.error('Connection URI:', maskedUri);

    if (error.name === 'MongooseServerSelectionError') {
      console.error('Server selection failed. Possible causes:');
      console.error('  1. IP not whitelisted in Atlas Network Access');
      console.error('  2. MongoDB Atlas cluster is paused or down');
      console.error('  3. Firewall/egress rules blocking outbound 27017');
      console.error('  4. Wrong credentials or authSource');
    }

    console.error(error.stack);

    process.exit(1);
  }
};

module.exports = connectDatabase;