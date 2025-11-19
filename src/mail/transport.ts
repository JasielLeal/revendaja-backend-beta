import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "contato@revendaja.com",
    pass: "|J1?f$tIe",
  },
});

interface SendEmailProps {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailProps) {
  try {
    await transporter.sendMail({
      from: `"Revendaja" <contato@revendaja.com>`,
      to,
      subject,
      text,
      html: html || text,
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Falha ao enviar email");
  }
}
