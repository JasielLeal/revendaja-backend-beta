import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailProps) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY não definido");
      throw new Error("RESEND_API_KEY não definido");
    }

    const result = await resend.emails.send({
      from: "Revendaja <contato@revendaja.com>",
      to,
      subject,
      html,
    });
    console.info("Email enviado", { to, subject, id: result?.data?.id });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Falha ao enviar email");
  }
}
