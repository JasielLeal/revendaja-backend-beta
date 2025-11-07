import { FastifyTypeInstance } from "@/types/fastify-instance";
import { PaymentService } from "./payment-service";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import { verifyToken } from "@/middlewares/verify-token";
import { z } from "zod";

export async function PaymentController(app: FastifyTypeInstance) {
  const userRepository = new UserPrismaRepository();
  const paymentService = new PaymentService(userRepository);

  app.post(
    "/payment/create-checkout",
    {
      schema: {
        tags: ["Payment"],
        description: "Create Stripe checkout session",
        body: z.object({
          priceId: z.string().min(1),
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        }),
        response: {
          200: z.object({
            sessionId: z.string(),
            url: z.string().nullable(),
          }),
          400: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (request, reply) => {
      try {
        const { priceId, successUrl, cancelUrl } = request.body;
        const userId = request.user.id;

        const session = await paymentService.createCheckoutSession(
          userId,
          priceId,
          successUrl,
          cancelUrl
        );

        return reply.status(200).send(session);
      } catch (error) {
        console.error("Checkout error:", error);

        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  app.post(
    "/payment/create-portal",
    {
      schema: {
        tags: ["Payment"],
        description: "Create Stripe customer portal session",
        body: z.object({
          returnUrl: z.string().url(),
        }),
        response: {
          200: z.object({
            url: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (request, reply) => {
      try {
        const { returnUrl } = request.body;
        const userId = request.user.id;

        const portalSession = await paymentService.createPortalSession(
          userId,
          returnUrl
        );

        return reply.status(200).send(portalSession);
      } catch (error) {
        console.error("Portal error:", error);

        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/payment/subscriptions",
    {
      schema: {
        tags: ["Payment"],
        description: "Get user subscriptions",
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              status: z.string(),
              currentPeriodEnd: z.number(),
              priceId: z.string().optional(),
              amount: z.number().nullable().optional(),
              currency: z.string().optional(),
            })
          ),
          400: z.object({
            error: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

        const subscriptions = await paymentService.getUserSubscriptions(userId);

        return reply.status(200).send(subscriptions);
      } catch (error) {
        console.error("Subscriptions error:", error);

        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message });
        }

        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
