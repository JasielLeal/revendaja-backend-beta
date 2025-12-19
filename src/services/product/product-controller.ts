import { FastifyTypeInstance } from "@/types/fastify-instance";
import { ProductPrismaRepository } from "./product-prisma-repository";
import { ProductService } from "./product-service";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";
import { requireAdmin } from "@/middlewares/check-permission";

export async function ProductController(app: FastifyTypeInstance) {
  const productRepository = new ProductPrismaRepository();
  const productService = new ProductService(productRepository);

  //get products
  app.post(
    "/products/migrate",
    {
      schema: {
        tags: ["Products"],
        description: "Migrate products from external source",
        body: z.object({}),
        response: {
          200: z.object({
            message: z.string().default("Products migrated successfully"),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
          403: z.object({
            error: z
              .string()
              .default("Apenas administradores podem realizar esta ação"),
          }),
        },
      },
      preHandler: [verifyToken, requireAdmin],
    },
    async (req, reply) => {
      try {
        await productService.migrateProducts();
        return reply
          .status(200)
          .send({ message: "Products migrated successfully" });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}
