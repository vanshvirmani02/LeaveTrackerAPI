import nodemailer from "nodemailer";
import { smtpConfig } from "../config/index.js";

let transporter;

const isSmtpConfigured = () =>
  Boolean(smtpConfig.host && smtpConfig.user && smtpConfig.pass);

const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn(
      "SMTP is not configured. Skipping email send. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.",
    );
    return { skipped: true };
  }

  const info = await mailTransporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    html,
    text,
  });

  return { skipped: false, messageId: info.messageId };
};

export default sendEmail;
