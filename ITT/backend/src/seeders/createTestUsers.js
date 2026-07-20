/**
 * One-time seed: creates test users
 *   - ishimwe  / passd123  → Admin
 *   - jeremie  / passd123  → Client (User role)
 *
 * Run: node backend/src/seeders/createTestUsers.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../backend/.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');
const { generateReferralCode } = require('../utils/helpers');

const users = [
  {
    username: 'ishimwe',
    email: 'ishimwe@invest.com',
    password: 'passd123',
    role: 'Admin',
    status: 'active',
  },
  {
    username: 'jeremie',
    email: 'jeremie@invest.com',
    password: 'passd123',
    role: 'User',
    status: 'active',
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    for (const u of users) {
      const existing = await User.findOne({ where: { username: u.username } });
      if (existing) {
        // Update password and role to make sure it matches
        const hashed = await bcrypt.hash(u.password, 12);
        await existing.update({ password: hashed, role: u.role, status: 'active' });
        console.log(`🔄 Updated existing user: ${u.username} → role:${u.role}`);
      } else {
        const hashed = await bcrypt.hash(u.password, 12);
        await User.create({
          username: u.username,
          email: u.email,
          password: hashed,
          role: u.role,
          status: u.status,
          referralCode: generateReferralCode(),
          balance: 0,
        });
        console.log(`✅ Created user: ${u.username} → role:${u.role}`);
      }
    }

    console.log('\n✅ Done! Users seeded:');
    console.log('  Admin:  username=ishimwe   password=passd123');
    console.log('  Client: username=jeremie   password=passd123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
