export function passwordChanged(name: string): string {
  return `
    <div style="background-color: #f9fafb; padding: 40px 0; font-family: 'Geist', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); padding: 40px; text-align: center;">

        <!-- Logo -->
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px;">
          <div style="width: 40px; height: 40px; background-color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 10px; box-shadow: 0 0 0 1px #e5e7eb;">
            <div style="width: 20px; height: 20px; border-radius: 4px; background-color: #007AFF;"></div>
          </div>
          <h1 style="font-size: 22px; font-weight: 600; color: #007AFF; margin: 0;">Odontly</h1>
        </div>

        <!-- Título -->
        <h2 style="color: #111827; margin-bottom: 12px;">Senha redefinida com sucesso</h2>

        <!-- Texto -->
        <p style="color: #6b7280; font-size: 15px; line-height: 22px; margin-bottom: 32px;">
          <strong>Olá, ${name}</strong><br>
          Informamos que sua senha na <strong>Odontly</strong> foi redefinida com sucesso.<br>
          Caso você não tenha solicitado essa alteração, recomendamos alterar sua senha imediatamente ou entrar em contato com o suporte.
        </p>

        <a href="https://odontly.com.br" style="display: inline-block; background-color: #007AFF; color: #fff; text-decoration: none; font-weight: 500; padding: 12px 28px; border-radius: 6px; font-size: 15px;">
          Acessar conta
        </a>

        <!-- Rodapé -->
        <p style="color: #9ca3af; font-size: 13px; margin-top: 36px;">
          Este é apenas um aviso automático. Nenhuma ação adicional é necessária se você reconhece esta alteração.
        </p>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
        © ${new Date().getFullYear()} Odontly — Todos os direitos reservados
      </p>
    </div>
  `;
}
