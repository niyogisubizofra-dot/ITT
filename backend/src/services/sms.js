const { client, fromPhone } = require('../config/sms');

async function sendSMS(to, body) {
  if (client && fromPhone) {
    try {
      const message = await client.messages.create({
        body,
        from: fromPhone,
        to
      });
      console.log('SMS sent successfully:', message.sid);
      return message;
    } catch (err) {
      console.error('Failed to send SMS via Twilio:', err.message);
      return null;
    }
  } else {
    console.log(`[SMS MOCK] To: ${to} | Body: ${body}`);
    return { sid: 'mock_sid_' + Math.random().toString(36).substring(7) };
  }
}

module.exports = {
  sendSMS
};
