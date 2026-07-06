const nodemailer = require('nodemailer');
const { getTransporter } = require('../config/mailer');

async function sendMail({ to, subject, text, html }) {
  try {
    const activeTransporter = await getTransporter();
    const info = await activeTransporter.sendMail({
      from: process.env.SMTP_FROM || '"Trading App Backend" <noreply@example.com>',
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent successfully:', info.messageId);

    // Try to get test email preview URL if using ethereal email
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`Email Preview URL: ${previewUrl}`);
      }
    }

    return info;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return null;
  }
}

module.exports = {
  sendMail
};

