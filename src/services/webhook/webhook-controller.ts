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
        console.log("Webhook received:", {
          headers: request.headers,
          method: request.method,
          url: request.url,
        });

        const signature = request?.headers["stripe-signature"] as string;

        if (!signature) {
          console.error("Missing stripe-signature header");
          return reply
            .status(400)
            .send({ error: "Missing stripe-signature header" });
        }

        // Para webhooks do Stripe, precisamos do raw body
        let body: string | Buffer;

        if (request.body instanceof Buffer) {
          body = request.body;
        } else if (typeof request.body === "string") {
          body = request.body;
        } else {
          body = JSON.stringify(request.body);
        }

        console.log("Processing webhook with body type:", typeof body);

        console.log(
          "Processing webhook with signature:",
          signature.substring(0, 20) + "..."
        );

        const result = await webhookService.processStripeWebhook(
          signature,
          body
        );

        console.log("Webhook processed successfully:", result);
        return reply.status(200).send(result);
      } catch (error) {
        console.error("Webhook error:", error);

        if (error instanceof AppError) {
          const statusCode = error.statusCode as 400 | 500;
          return reply.status(statusCode).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
