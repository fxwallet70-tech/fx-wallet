require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./src/models/Admin');

async function resetAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await Admin.findOneAndUpdate(
      {email: 'admin@nexora.com'},
      {
        $set: {
          fullName: 'FX Wallet Admin',
          email: 'admin@nexora.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    console.log('Admin account reset successfully');
    console.log('Email: admin@nexora.com');
    console.log('Password: admin123');
    console.log('Admin ID:', admin._id);
  } catch (error) {
    console.error('Reset failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdmin();