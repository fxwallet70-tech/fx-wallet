require('dotenv').config();

const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

async function removeOldAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing in .env');
    }

    await mongoose.connect(mongoUri);

    const result = await Admin.deleteOne({
      email: 'admin@nexora.com',
    });

    if (result.deletedCount > 0) {
      console.log('Old admin removed successfully');
      console.log('Deleted email: admin@nexora.com');
    } else {
      console.log('No old admin found to delete');
    }
  } catch (error) {
    console.error('Remove old admin failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

removeOldAdmin();
