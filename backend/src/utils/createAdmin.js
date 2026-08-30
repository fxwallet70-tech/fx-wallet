const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');

const createAdmin = async () => {
  const existingAdmin = await Admin.findOne({
    email: 'admin@fxwallet.com',
  });

  if (!existingAdmin) {
    const password = await bcrypt.hash('FXwallet70301043', 10);

    await Admin.create({
      fullName: 'FX Wallet Admin',
      email: 'admin@fxwallet.com',
      password,
    });

    console.log('Default Admin Created');
  }
};

module.exports = createAdmin;
