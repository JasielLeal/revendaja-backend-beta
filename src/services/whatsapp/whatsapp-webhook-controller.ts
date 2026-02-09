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

      

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return reply.status(200).send(challenge);
      } else {
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
                      

                      // Diferentes status possíveis:
                      // - sent: mensagem enviada ao servidor do WhatsApp
                      // - delivered: mensagem entregue ao dispositivo do usuário
                      // - read: mensagem lida pelo usuário
                      // - failed: falha no envio

                      if (status.status === "failed") {
                        // failure status received; handled silently here
                      }
                    }
                  }

                  // Mensagens recebidas (respostas do usuário)
                  if (value.messages && value.messages.length > 0) {
                    for (const message of value.messages) {
                      
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
