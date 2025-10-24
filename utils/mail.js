// utils/mail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,               // e.g. smtp.gmail.com or your SMTP
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || '"School Admin" <no-reply@school.local>';
  return transporter.sendMail({ from, to, subject, html, text });
};
