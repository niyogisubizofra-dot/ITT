const logger = require('../utils/logger');

let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (e) {
    logger.warn('Twilio not configured, SMS disabled.');
  }
}

const sendSMS = async (to, body) => {
  if (!twilioClient) {
    logger.warn(`SMS skipped (Twilio not configured): ${to}`);
    return;
  }
  try {
    await twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE, to });
    logger.info(`SMS sent to ${to}`);
  } catch (err) {
    logger.error(`SMS failed to ${to}:`, err.message);
  }
};

module.exports = { sendSMS };
