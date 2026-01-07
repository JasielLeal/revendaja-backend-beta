export function sendVerificationEmail(
  name: string,
  verificationCode: string
): string {
  return `
      <div style="background-color:#f9fafb;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:14px;box-shadow:0 10px 25px rgba(0,0,0,0.06);padding:40px;text-align:center;">

    <!-- Logo -->
    <div style="margin-bottom:28px;">
      <img
        src="https://revendaja.s3.us-east-2.amazonaws.com/logos/logo.png"
        alt="Revendaja"
        style="height:48px;display:block;margin:0 auto;"
      />
    </div>

    <!-- Texto -->
    <p style="font-size:15px;line-height:22px;color:#6b7280;margin:0 0 32px 0;">
      Olá <strong style="color:#111827;">${name}</strong>,<br />
      Seja bem-vindo ao <strong style="color:#FF6900;">Revendaja</strong>!  
      Para concluir seu cadastro, use o código abaixo para confirmar seu endereço de e-mail.
    </p>

    <!-- Código -->
    <div style="background-color:#fff7f2;border-radius:10px;padding:22px;margin-bottom:32px;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 8px 0;letter-spacing:1px;text-transform:uppercase;">
        Código de verificação
      </p>
      <p style="font-size:34px;font-weight:700;color:#FF6900;letter-spacing:6px;margin:0;font-family:'Courier New',monospace;">
        ${verificationCode}
      </p>
    </div>

    <!-- Avisos -->
    <p style="font-size:13px;color:#9ca3af;line-height:18px;margin:0;">
      Este código expira em <strong>24 horas</strong>.<br />
      Se você não criou uma conta no Revendaja, pode ignorar este e-mail.
    </p>
  </div>

  <!-- Footer -->
  <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px;">
    © ${new Date().getFullYear()} Revendaja. Todos os direitos reservados.
  </p>
</div>

    `;
}
