export function forgotPassword(name: string, otpCode: string): string {
  return `
      <div style="background-color:#f9fafb;padding:40px 0;font-family:'Geist','Helvetica Neue',Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:14px;padding:40px;text-align:left;">

    <!-- Logo -->
    <div style="margin-bottom:32px;">
      <img
        src="https://revendaja.s3.us-east-2.amazonaws.com/logos/logo.png"
        alt="Revendaja"
        style="height:40px;display:block;"
      />
    </div>

    <!-- Título -->
    <h1 style="font-size:20px;font-weight:500;margin:0 0 16px 0;color:#111827;">
      Redefinir sua senha
    </h1>

    <!-- Texto -->
    <p style="font-size:14px;line-height:20px;color:#3c4043;margin:0 0 16px 0;">
      Olá ${name},
    </p>

    <p style="font-size:14px;line-height:20px;color:#3c4043;margin:0 0 24px 0;">
      Recebemos uma solicitação para redefinir a senha da sua conta na
      <strong>Revendaja</strong>. Use o código abaixo para criar uma nova senha.
    </p>

    <!-- Código -->
    <div style="background-color:#fff7f2;border-left:4px solid #FF6900;padding:16px 20px;margin-bottom:24px;">
      <p style="font-size:12px;color:#5f6368;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:1px;">
        Código de redefinição
      </p>
      <p style="font-size:28px;font-weight:500;color:#FF6900;letter-spacing:6px;margin:0;font-family:'Courier New',monospace;">
        ${otpCode}
      </p>
    </div>

    <!-- Avisos -->
    <p style="font-size:13px;line-height:18px;color:#5f6368;margin:0 0 12px 0;">
      Este código expira em 1 hora.
    </p>

    <p style="font-size:13px;line-height:18px;color:#5f6368;margin:0;">
      Se você não solicitou a redefinição de senha, pode ignorar este e-mail.
    </p>
  </div>

  <!-- Footer -->
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:24px;">
    © ${new Date().getFullYear()} Revendaja
  </p>
</div>

    `;
}
