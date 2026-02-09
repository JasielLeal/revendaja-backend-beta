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
        const signature = request?.headers["stripe-signature"] as string;

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
        } else {
          // fallback - less reliable for signature verification
          if (request.body instanceof Buffer) {
            body = request.body;
          } else if (typeof request.body === "string") {
            body = request.body;
          } else {
            body = JSON.stringify(request.body);
          }
        }

        const result = await webhookService.processStripeWebhook(
          signature,
          body
        );
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
