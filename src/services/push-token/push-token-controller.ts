import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { PushTokenRepository } from "./push-token-repository";
import { verifyToken } from "@/middlewares/verify-token";

export async function PushTokenController(app: FastifyTypeInstance) {
  const repository = new PushTokenRepository();

  // Registrar token de push (COM AUTENTICAÇÃO - apenas dono da loja)
  app.post(
    "/push-tokens/register",
    {
      schema: {
        tags: ["Push Notifications"],
        description:
          "Registrar token de push (Expo/FCM/APNs) - Apenas dono da loja",
        security: [{ bearerAuth: [] }],
        body: z.object({
          token: z.string().min(1, "Token é obrigatório"),
          provider: z.enum(["expo", "fcm", "apns"]),
          deviceId: z.string().optional(),
          deviceName: z.string().optional(),
        }),
        response: {
          201: z.object({
            message: z.string(),
            pushToken: z.object({
              id: z.string(),
              token: z.string(),
              provider: z.string(),
              userId: z.string(),
              storeId: z.string(),
              deviceId: z.string().optional(),
              deviceName: z.string().optional(),
            }),
          }),
          400: z.object({
            error: z.string(),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const userId = req.user.id;
        const { token, provider, deviceId, deviceName } = req.body;

        console.log("User ID:", userId, "Token:", token, "Provider:", provider, "Device ID:", deviceId, "Device Name:", deviceName);

        const pushToken = await repository.upsert({
          token,
          provider,
          userId,
          deviceId,
          deviceName,
        });

        return reply.status(201).send({
          message: "Token registrado com sucesso",
          pushToken,
        });
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message || "Erro ao registrar token",
        });
      }
    }
  );

  // Obter tokens do usuário autenticado
  app.get(
    "/push-tokens/my-tokens",
    {
      schema: {
        tags: ["Push Notifications"],
        description: "Obter meus tokens de push registrados",
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            tokens: z.array(
              z.object({
                id: z.string(),
                token: z.string(),
                provider: z.string(),
                storeId: z.string(),
                deviceId: z.string().nullable(),
                deviceName: z.string().nullable(),
                createdAt: z.date(),
              })
            ),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const userId = req.user.id;

        const tokens = await repository.findByUserId(userId);

        return reply.status(200).send({
          tokens,
        });
      } catch (error: any) {
        return reply.status(401).send({
          error: error.message || "Erro ao buscar tokens",
        });
      }
    }
  );

  // Remover token
  app.post(
    "/push-tokens/deactivate",
    {
      schema: {
        tags: ["Push Notifications"],
        description: "Desativar token de push",
        security: [{ bearerAuth: [] }],
        body: z.object({
          token: z.string().min(1, "Token é obrigatório"),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { token } = req.body;

        await repository.deactivate(token);

        return reply.status(200).send({
          message: "Token desativado com sucesso",
        });
      } catch (error: any) {
        return reply.status(400).send({
          error: error.message || "Erro ao desativar token",
        });
      }
    }
  );
}
