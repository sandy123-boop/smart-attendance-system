const nodemailer = require('nodemailer');

let cachedTransporter = null;
let usingEthereal = false;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return cachedTransporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log('[mailer] using Ethereal test account:', testAccount.user);
  return cachedTransporter;
}

async function sendMail({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Smart Attendance" <no-reply@smartattendance.dev>',
    to,
    subject,
    text,
    html,
  });
  const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;
  if (previewUrl) console.log('[mailer] preview URL:', previewUrl);
  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendMail };
