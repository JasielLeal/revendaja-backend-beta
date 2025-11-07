import { FastifyInstance } from "fastify";
import { StoreProductPrismaRepository } from "./store-product-prisma-repository";
import { StoreProductService } from "./store-product-service";
import { CatalogPrismaRepository } from "../catalog/catalog-prisma-repository";
import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { verifyToken } from "@/middlewares/verify-token";
import { StorePrismaRepository } from "../store/store-prisma-repository";

export async function StoreProductController(app: FastifyTypeInstance) {
  const storeProductRepository = new StoreProductPrismaRepository();
  const catalogRepository = new CatalogPrismaRepository();
  const storeRepository = new StorePrismaRepository();
  const storeProductService = new StoreProductService(
    storeProductRepository,
    catalogRepository,
    storeRepository
  );

  // Adicionar produto do catálogo ao estoque da loja
  app.post(
    "/store-product",
    {
      schema: {
        tags: ["Store-Products"],
        description: "Add catalog product to store inventory",
        body: z.object({
          catalogId: z.number().min(1), // Mudei para number pois no schema é Int
          price: z.number().min(0.01).optional(), // Corrigi o .optional
          quantity: z.number().min(0).default(0), // Permite 0 como quantidade inicial
        }),
        response: {
          201: z.object({
            message: z.string().default("Store product created successfully"),
          }),
          400: z.object({
            error: z.string(),
          }),
          409: z.object({
            error: z.string().default("Produto já existe na loja"),
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
        const { catalogId, price, quantity } = req.body as {
          catalogId: number;
          storeId: string;
          price?: number;
          quantity: number;
        };

        const { id } = req.user;

        // Se price não foi informado, usa o preço sugerido do catálogo
        const finalPrice = price;
        await storeProductService.addCatalogProduct({
          catalogId,
          price: finalPrice,
          quantity,
          userId: id,
        });

        return reply.status(201).send({
          message: "Store product created successfully",
        });
      } catch (error: any) {
        console.log("❌ ERRO DETALHADO:", error);
        console.log("📋 Stack:", error.stack);

        console.log("📋 Error Message:", error.message);

        if (error.message.includes("Produto já existe na loja")) {
          return reply.status(409).send({
            error: error.message,
          });
        }

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

  // Listar todos os produtos de uma loja por paginação e pesquisa
  app.get(
    "/store-product",
    {
      schema: {
        tags: ["Store-Products"],
        description:
          "List products of a store with pagination and optional search query",
        querystring: z.object({
          page: z
            .string()
            .default("1")
            .transform((val) => parseInt(val, 10)),
          pageSize: z
            .string()
            .default("10")
            .transform((val) => parseInt(val, 10)),
          query: z.string().optional(),
        }),
        response: {
          200: z.object({
            data: z.array(
              z.object({
                id: z.string(), // UUID
                name: z.string(),
                price: z.number(),
                quantity: z.number(),
                brand: z.string(),
                company: z.string(),
                catalogPrice: z.number(),
                catalogId: z.number(),
                category: z.string(),
                imgUrl: z.string(),
                status: z.string(),
                storeId: z.string(),
                type: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
            ),
            pagination: z.object({
              page: z.number(),
              pageSize: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
          400: z.object({ error: z.string() }),
          401: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { page, pageSize, query } = req.query;
        const { id } = req.user;

        const result = await storeProductService.findAllStoreProducts(
          page,
          pageSize,
          id,
          query
        );

        // converter Date -> string ISO
        const serializedResult = {
          ...result,
          data: result.data.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
        };

        return reply.status(200).send(serializedResult);
      } catch (error: any) {
        console.log("❌ ERRO DETALHADO:", error);
        console.log("📋 Stack:", error.stack);
        
        return reply.status(500).send({
          error: "Internal server error: " + error.message,
        });
      }
    }
  );
}
