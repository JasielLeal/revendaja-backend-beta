import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";

import { StorePrismaRepository } from "../store/store-prisma-repository";
import { StoreProductPrismaRepository } from "../store-product/store-product-prisma-repository";
import { StoreWebService } from "./store-web-service";

export async function StoreWebController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const storeProductRepository = new StoreProductPrismaRepository();
  const storeWebService = new StoreWebService(
    storeRepository,
    storeProductRepository
  );

  // Obter informações da loja pelo subdomínio
  app.get(
    "/store/:subdomain",
    {
      schema: {
        tags: ["Store Web"],
        description: "Get store information by subdomain",
        params: z.object({
          subdomain: z.string().min(1),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            subdomain: z.string(),
            address: z.string(),
            phone: z.string().optional(),
            createdAt: z.string(),
            categories: z.array(z.string()),
            totalProducts: z.number(),
            productsByCategory: z.object({
              Masculino: z.number(),
              Feminino: z.number(),
            }),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { subdomain } = req.params;

        const storeData = await storeWebService.getStoreInfo(subdomain);

        return reply.status(200).send({
          ...storeData,
          createdAt: storeData.createdAt.toISOString(),
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar informações da loja:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Loja não encontrada",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Listar produtos da loja com filtros
  app.get(
    "/store/:subdomain/products",
    {
      schema: {
        tags: ["Store Web"],
        description: "Get store products with filters and pagination",
        params: z.object({
          subdomain: z.string().min(1),
        }),
        querystring: z.object({
          category: z.string().optional(),
          search: z.string().optional(),
          page: z.string().optional(),
          limit: z.string().optional(),
          orderBy: z.enum(["name", "price", "createdAt"]).optional(),
          orderDirection: z.enum(["asc", "desc"]).optional(),
        }),
        response: {
          200: z.object({
            products: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                price: z.number(),
                category: z.string().optional(),
                imgUrl: z.string().optional(),
                brand: z.string(),
                company: z.string(),
                quantity: z.number(),
                type: z.string(),
                createdAt: z.string(),
              })
            ),
            pagination: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              pages: z.number(),
            }),
            categories: z.array(z.string()),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { subdomain } = req.params;
        const {
          category,
          search,
          page = "1",
          limit = "12",
          orderBy = "createdAt",
          orderDirection = "desc",
        } = req.query;

        const productsData = await storeWebService.getStoreProducts(subdomain, {
          category,
          search,
          page: Number(page),
          limit: Number(limit),
          orderBy,
          orderDirection,
        });

        const sanitizedProducts = productsData.products.map((product) => ({
          id: product.id!,
          name: product.name,
          price: product.price,
          category: product.category,
          imgUrl: product.imgUrl,
          brand: product.brand,
          company: product.company,
          quantity: product.quantity,
          type: product.type,
          createdAt: product.createdAt.toISOString(),
        }));

        return reply.status(200).send({
          ...productsData,
          products: sanitizedProducts,
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar produtos da loja:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Loja não encontrada",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Obter detalhes de um produto específico
  app.get(
    "/store/:subdomain/products/:productId",
    {
      schema: {
        tags: ["Store Web"],
        description: "Get product details",
        params: z.object({
          subdomain: z.string().min(1),
          productId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
            category: z.string().optional(),
            imgUrl: z.string().optional(),
            brand: z.string(),
            company: z.string(),
            type: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
            catalogPrice: z.number().optional(),
            store: z.object({
              id: z.string(),
              name: z.string(),
              subdomain: z.string(),
              address: z.string(),
              phone: z.string().optional(),
            }),
          }),
          404: z.object({
            error: z.string().default("Product not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { subdomain, productId } = req.params;

        const product = await storeWebService.getProductDetails(
          subdomain,
          productId
        );

        return reply.status(200).send({
          ...product,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar detalhes do produto:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Produto não encontrado",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Obter categorias da loja
  app.get(
    "/store/:subdomain/categories",
    {
      schema: {
        tags: ["Store Web"],
        description: "Get store categories",
        params: z.object({
          subdomain: z.string().min(1),
        }),
        response: {
          200: z.object({
            categories: z.array(z.string()),
            categoriesCount: z.object({
              Masculino: z.number(),
              Feminino: z.number(),
            }),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { subdomain } = req.params;

        const categoriesData = await storeWebService.getStoreCategories(
          subdomain
        );

        return reply.status(200).send(categoriesData);
      } catch (error: any) {
        console.log("❌ ERRO ao buscar categorias da loja:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Loja não encontrada",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );
}
