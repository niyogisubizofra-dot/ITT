const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');
const { generateReferralCode } = require('../utils/helpers');

const seed = async () => {
  try {
    // ── CEO admin account ────────────────────────────────────────────────────
    const ceoEmail = process.env.CEO_EMAIL || 'ceo@invest.com';
    const existing = await User.findOne({ where: { email: ceoEmail } });

    if (!existing) {
      const hashed = await bcrypt.hash(process.env.CEO_PASSWORD || 'Admin@123456', 12);
      await User.create({
        username: process.env.CEO_USERNAME || 'CEO',
        email: ceoEmail,
        password: hashed,
        role: 'Admin',
        status: 'active',
        referralCode: generateReferralCode(),
        balance: 0,
      });
      logger.info(`✅ CEO admin account seeded → ${ceoEmail}`);
    } else {
      await existing.update({ role: 'Admin' });
      logger.info('ℹ️  CEO account role synced to Admin.');
    }

    // ── Admin account ─────────────────────────────────────────────────────────
    const adminEmail = 'admin@invest.com';
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      const hashed = await bcrypt.hash('Admin@123456', 12);
      await User.create({
        username: 'Admin',
        email: adminEmail,
        password: hashed,
        role: 'Admin',
        status: 'active',
        referralCode: generateReferralCode(),
        balance: 0,
      });
      logger.info(`✅ Admin account seeded → ${adminEmail}`);
    } else {
      await adminExists.update({ role: 'Admin' });
    }

    // ── Test Admin: ishimwe ───────────────────────────────────────────────────
    const ishimweExists = await User.findOne({ where: { username: 'ishimwe' } });
    if (!ishimweExists) {
      const hashed = await bcrypt.hash('passd123', 12);
      await User.create({
        username: 'ishimwe',
        email: 'ishimwe@invest.com',
        password: hashed,
        role: 'Admin',
        status: 'active',
        referralCode: generateReferralCode(),
        balance: 0,
      });
      logger.info('✅ Test Admin seeded → ishimwe');
    } else {
      const hashed = await bcrypt.hash('passd123', 12);
      await ishimweExists.update({ password: hashed, role: 'Admin', status: 'active' });
      logger.info('ℹ️  ishimwe account updated (role=Admin, password synced).');
    }

    // ── Test Client: jeremie ──────────────────────────────────────────────────
    const jeremieExists = await User.findOne({ where: { username: 'jeremie' } });
    if (!jeremieExists) {
      const hashed = await bcrypt.hash('passd123', 12);
      await User.create({
        username: 'jeremie',
        email: 'jeremie@invest.com',
        password: hashed,
        role: 'Client',
        status: 'active',
        referralCode: generateReferralCode(),
        balance: 500,
      });
      logger.info('✅ Test Client seeded → jeremie');
    } else {
      const hashed = await bcrypt.hash('passd123', 12);
      await jeremieExists.update({ password: hashed, role: 'Client', status: 'active' });
      logger.info('ℹ️  jeremie account updated (role=Client, password synced).');
    }

  } catch (err) {
    logger.error('❌ Seeder error:', err.message);
  }
};

module.exports = seed;
