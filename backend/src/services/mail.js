const transporter = require('../config/mailer');

async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Trading App Backend" <noreply@example.com>',
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return null;
  }
}

module.exports = {
  sendMail
};
