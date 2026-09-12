const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const email = process.env.SMTP_EMAIL;
  const appPassword = (process.env.SMTP_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!email || !appPassword) {
    throw new Error(
      'SMTP_EMAIL / SMTP_APP_PASSWORD are not set. Copy backend/.env.example to .env and fill them.'
    );
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: appPassword,
    },
  });

  return transporter;
}

const sendEmail = async ({ to, subject, text, html }) => {
  const from = process.env.SMTP_FROM || `Nexora <${process.env.SMTP_EMAIL}>`;
  const t = getTransporter();
  return t.sendMail({ from, to, subject, text, html });
};

const sendPasswordResetEmail = async ({ to, fullName, code }) => {
  const subject = 'Nexora Password Reset Code';
  const text =
    `Hi ${fullName || 'there'},\n\n` +
    `Your Nexora password reset code is: ${code}\n\n` +
    `It is valid for 10 minutes. If you did not request this, please ignore this email.\n\n` +
    `— Nexora / FX Wallet Support (https://t.me/FXwallet0)`;
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">` +
    `<h2 style="margin:0 0 8px">Nexora Password Reset</h2>` +
    `<p>Hi ${fullName || 'there'},</p>` +
    `<p>Your password reset code is:</p>` +
    `<div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f4f4f5;padding:12px 16px;border-radius:8px;text-align:center">${code}</div>` +
    `<p style="color:#555">Valid for 10 minutes. If you did not request this, ignore this email.</p>` +
    `<p style="color:#888;font-size:12px">Nexora / FX Wallet — https://t.me/FXwallet0</p>` +
    `</div>`;
  return sendEmail({ to, subject, text, html });
};

module.exports = { sendEmail, sendPasswordResetEmail };
