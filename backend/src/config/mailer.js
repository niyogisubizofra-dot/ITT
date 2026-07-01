const nodemailer = require('nodemailer');
require('dotenv').config();

// Create nodemailer transporter.
// We configure it to use standard SMTP settings from env, with a fallback.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '', // generated ethereal user
    pass: process.env.SMTP_PASS || '', // generated ethereal password
  },
});

module.exports = transporter;
