export function passwordChanged(name: string): string {
  return `
    <div style="background-color:#f9fafb;padding:40px 0;font-family: 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif;color:#111827;">
  <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:14px;padding:40px;text-align:left;">

    <!-- Logo -->
    <div style="margin-bottom:32px;text-align:left;">
      <img
        src="https://revendaja.s3.us-east-2.amazonaws.com/logos/logo.png"
        alt="Revendaja"
        style="height:40px;display:block;"
      />
    </div>

    <!-- Título -->
    <h1 style="font-size:20px;font-weight:500;margin:0 0 16px 0;color:#111827;">
      Senha redefinida com sucesso
    </h1>

    <!-- Texto -->
    <p style="font-size:14px;line-height:20px;color:#3c4043;margin:0 0 16px 0;">
      Olá ${name},
    </p>

    <p style="font-size:14px;line-height:20px;color:#3c4043;margin:0 0 24px 0;">
      A senha da sua conta no <strong>Revendaja</strong> foi redefinida com sucesso.
      Se você realizou essa alteração, nenhuma ação adicional é necessária.
    </p>

    <!-- Alerta -->
    <div style="background-color:#fff7f2;border-left:4px solid #FF6900;padding:12px 16px;margin-bottom:24px;">
      <p style="font-size:13px;line-height:18px;color:#5f6368;margin:0;">
        Caso você não reconheça esta alteração, recomendamos que redefina sua senha imediatamente
        ou entre em contato com o suporte.
      </p>
    </div>

    <!-- Rodapé -->
    <p style="font-size:12px;color:#9ca3af;line-height:18px;margin-top:32px;">
      Este é um e-mail automático. Não responda a esta mensagem.
    </p>
  </div>

  <!-- Footer externo -->
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:24px;">
    © ${new Date().getFullYear()} Revendaja
  </p>
</div>

  `;
}
