require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./src/models/Admin');

async function createFxAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const existing = await Admin.findOne({
      email: 'admin@fxwallet.com',
    });

    if (existing) {
      console.log('Admin already exists:', existing.email);
      await mongoose.disconnect();
      return;
    }

    const password = await bcrypt.hash('FXwallet70301043', 10);

    await Admin.create({
      fullName: 'FX Wallet Admin',
      email: 'admin@fxwallet.com',
      password,
    });

    console.log('Admin created successfully');
    console.log('Email: admin@fxwallet.com');
    console.log('Password: FXwallet70301043');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createFxAdmin();
