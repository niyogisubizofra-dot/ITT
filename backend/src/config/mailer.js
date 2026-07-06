const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
  if (hasCredentials) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback / Auto-generate test account for Ethereal email
  try {
    console.log('Generating Ethereal SMTP test credentials dynamically...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`Generated Ethereal user: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.error('Failed to create Ethereal test account, falling back to mock transporter:', err.message);
    // fallback to a mock/stub transporter so it doesn't fail
    transporter = {
      sendMail: async (options) => {
        console.log('--- MOCK EMAIL SENT ---');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Text:', options.text);
        if (options.html) console.log('HTML:', options.html);
        console.log('-----------------------');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
    return transporter;
  }
}

module.exports = { getTransporter };

