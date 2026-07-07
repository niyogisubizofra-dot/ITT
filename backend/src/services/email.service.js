const transporter = require('../config/mailer');
const logger = require('../utils/logger');

const sendEmail = async ({ to, subject, html, text }) => {
  // Skip silently if SMTP is not configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email')) return;
  try {
    await transporter.sendMail({
      from: `"INVEST Platform" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
    // Don't throw — email failure shouldn't break the request
  }
};

const sendPasswordReset = (to, token) =>
  sendEmail({
    to,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${process.env.CLIENT_URL}/reset-password?token=${token}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

const sendWelcome = (to, username) =>
  sendEmail({
    to,
    subject: 'Welcome to INVEST Platform',
    html: `<h2>Welcome, ${username}!</h2><p>Your account has been created successfully.</p>`,
  });

const sendTransactionNotification = (to, type, amount, status) =>
  sendEmail({
    to,
    subject: `Transaction ${status}: ${type}`,
    html: `<h2>Transaction Update</h2><p>Your ${type} of <strong>$${amount}</strong> has been <strong>${status}</strong>.</p>`,
  });

module.exports = { sendEmail, sendPasswordReset, sendWelcome, sendTransactionNotification };
