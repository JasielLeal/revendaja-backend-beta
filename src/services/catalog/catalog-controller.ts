import { FastifyTypeInstance } from "@/types/fastify-instance";
import { CatalogPrismaRepository } from "./catalog-prisma-repository";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { CatalogService } from "./catalog-service";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";

export async function CatalogController(app: FastifyTypeInstance) {
  const catalogRepository = new CatalogPrismaRepository();
  const storeRepository = new StorePrismaRepository();
  const catalogService = new CatalogService(catalogRepository, storeRepository);

  app.get(
    "/catalog/find-all",
    {
      schema: {
        tags: ["Catalog"],
        description: "Find all catalog products with pagination",
        querystring: z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(10),
        }),
        response: {
          200: z.object({
            products: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                price: z.number(),
                image: z.string().nullable().optional(),
                // adicione outros campos se quiser
              })
            ),
            page: z.number(),
            pageSize: z.number(),
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
    async (req, reply) => {
      try {
        const { page, pageSize } = req.query;

        const userId = req.user.id;

        console.log(userId);

        const products = await catalogService.getAll(userId, page, pageSize);

        return reply.status(200).send({
          products: products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.normalPrice,
            image: product.imgUrl,
          })),
          page,
          pageSize,
        });
      } catch (error: any) {
        console.log("❌ ERRO DETALHADO:", error);
        console.log("📋 Stack:", error.stack);

        if (error.message.includes("not found")) {
          return reply.status(400).send({
            error: error.message,
          });
        }

        return reply.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );
}
