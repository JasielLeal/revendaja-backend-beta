export function sendVerificationEmail(
  name: string,
  verificationCode: string
): string {
  return `
      <div style="background-color: #f9fafb; padding: 40px 0; font-family: 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); padding: 40px; text-align: center;">
          
          <!-- Logo -->
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px;">
            <div style="width: 40px; height: 40px; background-color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; box-shadow: 0 0 0 1px #e5e7eb;">
              <div style="width: 20px; height: 20px; border-radius: 4px; background-color: #007AFF;"></div>
            </div>
            <h1 style="font-size: 22px; font-weight: 600; color: #007AFF; margin: 0;">Revendaja</h1>
          </div>

          <!-- Título -->
          <h2 style="color: #111827; margin-bottom: 12px;">Verifique seu e-mail</h2>

          <!-- Texto -->
          <p style="color: #6b7280; font-size: 15px; line-height: 22px; margin-bottom: 32px;">
            Olá <strong>${name}</strong>, obrigado por se cadastrar no <strong>Revendaja</strong>.<br>
            Use o código abaixo para confirmar seu endereço de e-mail.
          </p>

          <!-- Código de Verificação -->
          <div style="background-color: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Código de Verificação</p>
            <p style="font-size: 32px; font-weight: 700; color: #007AFF; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">${verificationCode}</p>
          </div>

          <!-- Rodapé -->
          <p style="color: #9ca3af; font-size: 13px; margin-top: 36px;">
            Se você não criou uma conta, ignore este e-mail.<br>
            Este código expira em 24 horas.
          </p>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          © ${new Date().getFullYear()} Revendaja — Todos os direitos reservados
        </p>
      </div>
    `;
}
