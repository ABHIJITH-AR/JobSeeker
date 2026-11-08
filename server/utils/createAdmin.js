require('dotenv').config();

const crypto = require('crypto');
const connectDB = require('../config/db');
const User = require('../models/User');

async function createAdmin({ exit = true } = {}) {
  await connectDB();

  const name = process.env.ADMIN_NAME || 'Site Administrator';
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  let password = process.env.ADMIN_PASSWORD;
  const phone = process.env.ADMIN_PHONE || '9999999999';

  if (!email) {
    throw new Error('ADMIN_EMAIL is required. Set it in server/.env before creating the admin account.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL is not a valid email address.');
  }

  let generated = false;
  if (!password) {
    password = `Admin@${crypto.randomBytes(9).toString('base64url')}9`;
    generated = true;
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.isActive = true;
      await existing.save({ validateBeforeSave: false });
      // eslint-disable-next-line no-console
      console.log(`Existing user ${email} promoted to admin. Password was NOT changed.`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Admin account already exists for ${email}. No changes made.`);
    }
    if (exit) process.exit(0);
    return existing;
  }

  const admin = await User.create({
    name,
    email,
    phone,
    password,
    role: 'admin',
    isActive: true,
  });

  // eslint-disable-next-line no-console
  console.log('Admin account created successfully:');
  // eslint-disable-next-line no-console
  console.log(`  Email:    ${email}`);
  if (generated) {
    // eslint-disable-next-line no-console
    console.log(`  Password: ${password}`);
    // eslint-disable-next-line no-console
    console.log('  IMPORTANT: Store this password securely. It will not be shown again.');
  } else {
    // eslint-disable-next-line no-console
    console.log('  Password: (the value of ADMIN_PASSWORD from your environment)');
  }

  if (exit) process.exit(0);
  return admin;
}

if (require.main === module) {
  createAdmin().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  });
}

module.exports = createAdmin;
