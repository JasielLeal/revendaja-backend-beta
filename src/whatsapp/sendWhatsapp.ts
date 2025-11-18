import axios from "axios";

export async function sendWhatsappMessage(to: string, message: string) {
  const token =
    "EAAQjf2LGwNUBP5WxwPDIQPflvbZCr3PZA4h7uz9XMnMhnaoNIPHVcuPFcdRr3RPl9roLsqJoUZB9SDX6UcZCnazJipme4d5LiKwnRgbajqptZBgVBeJSGRIqX6qz4lddU2kKpOshAl42HGZB4XYhweeeWhT9IjAPFuibrAUVoiGN8NGzPGdqqnx0eE3VjQFfbjOiOZCE8UeiADVNXKsZCBogIuZBnkf7UNYykNJv4tXclY7DboH7eiqYpKOG3VyCIrq3DaRJGBX9cngNbgUIrVMDcJYlb";
  const phoneNumberId = 872429802622777;

  // Limpar e formatar o número de telefone (remover espaços, hífens, parênteses)
  const cleanedPhone = to.replace(/[\s\-\(\)]/g, "");

  // Garantir que o número tenha o código do país (assumindo Brasil +55)
  const formattedPhone = cleanedPhone.startsWith("55")
    ? cleanedPhone
    : `55${cleanedPhone}`;

  console.log("📱 Tentando enviar WhatsApp para:", formattedPhone);
  console.log("📝 Mensagem:", message);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: 5584992092241,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ WhatsApp enviado com sucesso!", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Erro ao enviar WhatsApp:",
      error.response?.data || error.message
    );
    throw error;
  }
}
