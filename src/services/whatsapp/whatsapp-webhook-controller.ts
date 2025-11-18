import { FastifyTypeInstance } from "@/types/fastify-instance";
import z from "zod";

export async function WhatsappWebhookController(app: FastifyTypeInstance) {
  // Verificação do webhook (GET) - necessário para validar o webhook no Meta
  app.get(
    "/webhook/whatsapp",
    {
      schema: {
        tags: ["WhatsApp Webhook"],
        description: "Verify WhatsApp webhook",
        querystring: z.object({
          "hub.mode": z.string(),
          "hub.verify_token": z.string(),
          "hub.challenge": z.string(),
        }),
      },
    },
    async (req, reply) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      const VERIFY_TOKEN =
        process.env.WHATSAPP_VERIFY_TOKEN ||
        "EAAQjf2LGwNUBP06isiTkcctDYDo8hBtZCsnbMpKiSwZC1xakNssdF5owgz5iVK3mdXZAqbyrjsZC7X6qe5BrrYJKnS8ogxvUxWZA8Wis2Bq7RkZBEcOgBeIZC2B8KdA8p6CGqER1IDGevRVPiJra1jUm5qt7eilB3pRCC1B0XSPvZA3yTBtSWejye0d2uXl8QjanP4OaqxuFK3MGN95QK8aEVJZB8oOwhfx2oHPdZAbpYCcjZC0CeeMvSaGHUFhpoFIeePUstFb3TN1yRpFZB2xscdC61uZC2lAZDZD";

      console.log("🔍 Verificação de webhook recebida");
      console.log("Mode:", mode);
      console.log("Token recebido:", token);

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verificado com sucesso!");
        return reply.status(200).send(challenge);
      } else {
        console.log("❌ Falha na verificação do webhook");
        return reply.status(403).send("Forbidden");
      }
    }
  );

  // Receber notificações do WhatsApp (POST)
  app.post(
    "/webhook/whatsapp",
    {
      schema: {
        tags: ["WhatsApp Webhook"],
        description: "Receive WhatsApp webhook notifications",
      },
    },
    async (req, reply) => {
      try {
        const body = req.body as any;

        console.log("📨 Webhook WhatsApp recebido:");
        console.log(JSON.stringify(body, null, 2));

        // Verificar se há entradas de status
        if (body.entry && body.entry.length > 0) {
          for (const entry of body.entry) {
            if (entry.changes && entry.changes.length > 0) {
              for (const change of entry.changes) {
                if (change.value) {
                  const value = change.value;

                  // Status de mensagens
                  if (value.statuses && value.statuses.length > 0) {
                    for (const status of value.statuses) {
                      console.log("\n📊 STATUS DA MENSAGEM:");
                      console.log("ID:", status.id);
                      console.log("Status:", status.status);
                      console.log("Timestamp:", status.timestamp);
                      console.log("Destinatário:", status.recipient_id);

                      // Diferentes status possíveis:
                      // - sent: mensagem enviada ao servidor do WhatsApp
                      // - delivered: mensagem entregue ao dispositivo do usuário
                      // - read: mensagem lida pelo usuário
                      // - failed: falha no envio

                      if (status.status === "failed") {
                        console.log("❌ FALHA NO ENVIO!");
                        if (status.errors && status.errors.length > 0) {
                          console.log(
                            "Erros:",
                            JSON.stringify(status.errors, null, 2)
                          );
                        }
                      } else if (status.status === "delivered") {
                        console.log("✅ Mensagem entregue com sucesso!");
                      } else if (status.status === "read") {
                        console.log("👀 Mensagem lida!");
                      } else if (status.status === "sent") {
                        console.log("📤 Mensagem enviada!");
                      }
                    }
                  }

                  // Mensagens recebidas (respostas do usuário)
                  if (value.messages && value.messages.length > 0) {
                    for (const message of value.messages) {
                      console.log("\n💬 MENSAGEM RECEBIDA:");
                      console.log("De:", message.from);
                      console.log("ID:", message.id);
                      console.log("Timestamp:", message.timestamp);
                      console.log("Tipo:", message.type);

                      if (message.text) {
                        console.log("Texto:", message.text.body);
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Sempre retornar 200 para confirmar recebimento
        return reply.status(200).send({ status: "ok" });
      } catch (error: any) {
        console.error("❌ Erro ao processar webhook:", error);
        // Mesmo com erro, retornar 200 para não receber reenvios
        return reply
          .status(200)
          .send({ status: "error", message: error.message });
      }
    }
  );
}
