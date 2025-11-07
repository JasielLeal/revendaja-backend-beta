import { FastifyTypeInstance } from "@/types/fastify-instance";
import { WebhookService } from "./webhook-service";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import { AppError } from "@/lib/AppError";
import { z } from "zod";

export async function WebhookController(app: FastifyTypeInstance) {
  const userRepository = new UserPrismaRepository();
  const webhookService = new WebhookService(userRepository);

  app.post(
    "/webhook/stripe",
    {
      schema: {
        tags: ["Webhooks"],
        description: "Handle Stripe webhook events",
        response: {
          200: z.object({
            received: z.boolean(),
          }),
          400: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        console.log("🔔 WEBHOOK STRIPE RECEBIDO!");
        console.log("📅 Timestamp:", new Date().toISOString());
        console.log(
          "🌐 Headers completos:",
          JSON.stringify(request.headers, null, 2)
        );
        console.log("📝 Method:", request.method);
        console.log("🔗 URL:", request.url);

        const signature = request?.headers["stripe-signature"] as string;

        console.log(
          "🔐 Stripe Signature:",
          signature ? "✅ Presente" : "❌ Ausente"
        );

        if (!signature) {
          console.error("❌ ERRO: Missing stripe-signature header");
          return reply
            .status(400)
            .send({ error: "Missing stripe-signature header" });
        }

        // Para webhooks do Stripe, precisamos do raw body. We prefer the rawBody
        // attached by the content parser (see server.ts). If not present, fall back
        // to the parsed body but note the risk to signature verification.
        let body: string | Buffer;
        const raw = (request as any).rawBody as Buffer | undefined;

        if (raw) {
          body = raw;
          console.log(
            "📦 Body type: raw Buffer (from content parser), tamanho:",
            Buffer.isBuffer(body) ? body.length : String(body).length
          );
          try {
            console.log(
              "📄 Body content preview:",
              JSON.stringify(JSON.parse(raw.toString("utf8")), null, 2)
            );
          } catch (e) {
            console.log("⚠️ Não foi possível parsear raw body para preview");
          }
        } else {
          // fallback - less reliable for signature verification
          if (request.body instanceof Buffer) {
            body = request.body;
            console.log("📦 Body type: Buffer, tamanho:", body.length);
          } else if (typeof request.body === "string") {
            body = request.body;
            console.log("📦 Body type: String, tamanho:", body.length);
          } else {
            body = JSON.stringify(request.body);
            console.log(
              "📦 Body type: JSON stringified, tamanho:",
              body.length
            );
            console.log(
              "📄 Body content preview:",
              JSON.stringify(request.body, null, 2)
            );
          }
        }

        console.log("🔄 Iniciando processamento do webhook...");

        const result = await webhookService.processStripeWebhook(
          signature,
          body
        );

        console.log("✅ Webhook processado com sucesso:", result);
        return reply.status(200).send(result);
      } catch (error) {
        console.error("❌ ERRO NO WEBHOOK:", error);
        console.error(
          "📍 Stack trace:",
          error instanceof Error ? error.stack : "N/A"
        );

        if (error instanceof AppError) {
          const statusCode = error.statusCode as 400 | 500;
          console.error(
            `🚨 AppError - Status: ${statusCode}, Message: ${error.message}`
          );
          return reply.status(statusCode).send({ error: error.message });
        }

        console.error("🚨 Erro interno não tratado");
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
