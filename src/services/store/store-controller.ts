import { FastifyTypeInstance } from "@/types/fastify-instance";
import { StorePrismaRepository } from "./store-prisma-repository";
import { StoreService } from "./store-service";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";

export async function StoreController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const userRepository = new UserPrismaRepository();
  const storeService = new StoreService(storeRepository, userRepository);

  app.post(
    "/stores",
    {
      schema: {
        tags: ["Stores"],
        description: "Create a new store",
        body: z.object({
          name: z.string().min(1),
          address: z.string().min(1),
          phone: z.string().min(1),
        }),
        response: {
          201: z.object({
            Success: z.string(),
            Code: z.string(),
            data: z.any(),
          }),
          409: z.object({
            Success: z.string(),
            Code: z.string(),
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { name, address, phone } = req.body;
        const userId = req.user.id;

        const store = await storeService.createStore(
          { name, address, phone, subdomain: "", userId: "" },
          userId
        );
        return reply.status(201).send({
          Success: "True",
          Code: "201",
          data: store,
        });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}
