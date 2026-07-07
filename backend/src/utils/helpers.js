const { v4: uuidv4 } = require('uuid');

/** Generate a unique referral code */
const generateReferralCode = () => uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();

/** Generate a unique transaction reference */
const generateReference = (prefix = 'TXN') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

/** Calculate date range for reports */
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'daily': start.setHours(0, 0, 0, 0); break;
    case 'weekly': start.setDate(now.getDate() - 7); break;
    case 'monthly': start.setMonth(now.getMonth() - 1); break;
    case 'quarterly': start.setMonth(now.getMonth() - 3); break;
    case 'annual': start.setFullYear(now.getFullYear() - 1); break;
    default: start.setMonth(now.getMonth() - 1);
  }

  return { start, end: now };
};

module.exports = { generateReferralCode, generateReference, getDateRange };
