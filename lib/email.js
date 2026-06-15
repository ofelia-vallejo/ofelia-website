'use strict';

// Singleton SMTP transporter. SRP: this module owns all email-sending concerns.
// Import sendMail() instead of creating nodemailer instances per request.

const nodemailer = require('nodemailer');
const config = require('./config');

let _transporter = null;

function getTransporter() {
  if (!config.smtpConfigured) return null;
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return _transporter;
}

// Sends an email if SMTP is configured; in dev mode logs and resolves successfully.
async function sendMail({ to, replyTo, subject, text }) {
  const transporter = getTransporter();
  const from = `"Ofelia Vallejo Web" <${config.smtp.user}>`;

  if (!transporter) {
    console.log('[email] DEV MODE — SMTP not configured:', { to, subject });
    return { dev: true };
  }

  return transporter.sendMail({ from, to, replyTo, subject, text });
}

async function sendContact({ nombre, email, asunto, mensaje }) {
  return sendMail({
    to: config.emailTo,
    replyTo: email,
    subject: `[Contacto OV] ${asunto || 'Nuevo mensaje'}`,
    text: [`Nombre: ${nombre}`, `Email: ${email}`, `Asunto: ${asunto || '—'}`, '', mensaje].join('\n'),
  });
}

async function sendPersonalizacion({ ref, subject, body, replyTo }) {
  return sendMail({
    to: config.emailTo,
    replyTo: replyTo || config.emailTo,
    subject: subject || `[Personalización OV] ${ref}`,
    text: body,
  });
}

module.exports = { sendMail, sendContact, sendPersonalizacion, isConfigured: () => config.smtpConfigured };
