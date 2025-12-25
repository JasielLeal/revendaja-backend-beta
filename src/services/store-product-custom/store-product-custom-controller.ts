import { FastifyTypeInstance } from "@/types/fastify-instance";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { StoreProductCustomPrismaRepository } from "./store-product-custom-prisma-repository";
import z from "zod";
import { StoreProductCustomService } from "./store-product-custom-service";
import { verifyToken } from "@/middlewares/verify-token";

export async function StoreProductCustomController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const storeProductCustom = new StoreProductCustomPrismaRepository();
  const storeProductCustomService = new StoreProductCustomService(
    storeProductCustom,
    storeRepository
  );

  app.post(
    "/store-products-custom",
    {
      schema: {
        tags: ["Store-Products-Custom"],
        description: "Create a custom product for the store",
        body: z.object({
          name: z.string().min(1),
          price: z.number().min(0.01),
          quantity: z.number().min(0).default(0),
          imgUrl: z.string().url().optional(),
          costPrice: z.number().min(0).optional(),
        }),

        response: {
          201: z.object({
            message: z.string().default("Custom product created successfully"),
          }),
          404: z.object({
            message: z.string().default("Store not found"),
          }),
          400: z.object({
            message: z.string().default("Bad Request"),
          }),
          500: z.object({
            message: z.string().default("Internal Server Error"),
          }),
        },
      },
      preHandler: [verifyToken]
    },
    async (request, reply) => {
      const { name, price, quantity, imgUrl, costPrice } = request.body as {
        name: string;
        price: number;
        quantity: number;
        imgUrl?: string;
        costPrice?: number;
      };
      
      const userId = request.user.id;
      const userPlan = request.user.plan;

      try {
        await storeProductCustomService.createCustomProduct(
          {
            name,
            price,
            quantity,
            imgUrl,
            costPrice,
          },
          userId,
          userPlan
        );
        return reply.status(201).send({
          message: "Custom product created successfully",
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Store not found") {
          return reply.status(404).send({
            message: "Store not found",
          });
        }        

        return reply.status(500).send({
          message: "Internal Server Error",
        });
      }
    }
  );
}
