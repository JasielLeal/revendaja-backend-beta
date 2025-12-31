import { StoreProductPrismaRepository } from "./store-product-prisma-repository";
import { StoreProductService } from "./store-product-service";
import { CatalogPrismaRepository } from "../catalog/catalog-prisma-repository";
import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { verifyToken } from "@/middlewares/verify-token";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { Plan } from "@/config/plans";
import { StoreProductCustomPrismaRepository } from "../store-product-custom/store-product-custom-prisma-repository";
import { CheckPlanLimits } from "@/middlewares/check-plan-limits";

export async function StoreProductController(app: FastifyTypeInstance) {
  const storeProductRepository = new StoreProductPrismaRepository();
  const catalogRepository = new CatalogPrismaRepository();
  const storeRepository = new StorePrismaRepository();
  const storeProductCustomRepository = new StoreProductCustomPrismaRepository();
  const storeProductService = new StoreProductService(
    storeProductRepository,
    catalogRepository,
    storeRepository,
    storeProductCustomRepository
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
          validityDate: z.string().optional().default("2025-12-31").nullable(), // Data de validade do produto
          costPrice: z.number().min(0).optional(),
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
      preHandler: [verifyToken, CheckPlanLimits],
    },

    async (req, reply) => {
      try {
        const { catalogId, price, quantity, costPrice, validityDate } =
          req.body as {
            catalogId: number;
            storeId: string;
            price?: number;
            quantity: number;
            validityDate?: string;
            costPrice?: number;
          };
        const { id, plan } = req.user;
        const userPlan = (plan || "Free") as Plan;

        // Se price não foi informado, usa o preço sugerido do catálogo
        const finalPrice = price;
        await storeProductService.addCatalogProduct({
          catalogId,
          price: finalPrice,
          quantity,
          userId: id,
          userPlan,
          validityDate: new Date(validityDate),
          costPrice: costPrice,
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
          category: z.string().optional(),
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
                barcode: z.string(),
                company: z.string(),
                catalogPrice: z.number().nullable().optional(),
                catalogId: z.number().nullable().optional(),
                category: z.string(),
                imgUrl: z.string().nullable(),
                status: z.string(),
                storeId: z.string(),
                type: z.string(),
                validity_date: z.date().nullable(),
                cost_price: z.number().nullable(),
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
        const { page, pageSize, query, category } = req.query;
        const { id } = req.user;

        const result = await storeProductService.findAllStoreProducts(
          page,
          pageSize,
          id,
          query,
          category
        );

        console.log("✅ Produtos retornados:", result);

        // converter Date -> string ISO
        const serializedResult = {
          ...result,
          data: result.data.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          })),
        };

        console.log("✅ Resultado serializado:", serializedResult);

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

  // Rota unificada para atualizar produto (preço, quantidade, status)
  app.patch(
    "/store-product/:id",
    {
      schema: {
        tags: ["Store-Products"],
        description:
          "Update store product (price, quantity, status) - all fields optional",
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          price: z.number().min(0.01).optional(),
          quantity: z.number().min(0).optional(),
          status: z.enum(["active", "inactive"]).optional(),
          validityDate: z.string().optional().default("2025-12-31"),
          costPrice: z.number().min(0).optional(),
        }),
        response: {
          200: z.object({
            message: z.string(),
            updatedFields: z.array(z.string()),
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
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
        const { id } = req.params;
        const { price, quantity, status, validityDate, costPrice } = req.body;
        const userId = req.user.id;

        // Validar se pelo menos um campo foi enviado
        if (
          price === undefined &&
          quantity === undefined &&
          status === undefined
        ) {
          return reply.status(400).send({
            error:
              "Pelo menos um campo deve ser informado (price, quantity ou status)",
          });
        }

        const updatedFields = await storeProductService.updateProduct(
          id,
          userId,
          {
            price,
            quantity,
            status,
            validity_date: new Date(validityDate),
            cost_price: costPrice,
          }
        );

        return reply.status(200).send({
          message: "Produto atualizado com sucesso",
          updatedFields,
        });
      } catch (error: any) {
        console.log("❌ ERRO ao atualizar produto:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Produto não encontrado",
          });
        }

        if (error.message.includes("does not belong")) {
          return reply.status(400).send({
            error: error.message,
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  app.get(
    "/store-product/barcode/:barcode",
    {
      schema: {
        tags: ["Store-Products"],
        description:
          "Get store product by barcode or list all custom products if barcode matches subdomain",
        params: z.object({
          barcode: z.string(),
        }),
        querystring: z.object({
          page: z
            .string()
            .default("1")
            .transform((val) => parseInt(val, 10)),
          pageSize: z
            .string()
            .default("10")
            .transform((val) => parseInt(val, 10)),
        }),
        response: {
          200: z.union([
            // Resposta para um único produto
            z.object({
              id: z.string(),
              name: z.string(),
              price: z.number(),
              quantity: z.number(),
              brand: z.string(),
              imgUrl: z.string(),
              company: z.string(),
              category: z.string(),
              status: z.enum(["active", "inactive"]),
            }),
            // Resposta para lista de produtos (quando barcode = subdomain)
            z.object({
              products: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  price: z.number(),
                  quantity: z.number(),
                  brand: z.string(),
                  imgUrl: z.string().nullable(),
                  company: z.string(),
                  category: z.string(),
                  status: z.enum(["active", "inactive"]),
                })
              ),
              pagination: z.object({
                page: z.number(),
                pageSize: z.number(),
                total: z.number(),
              }),
            }),
          ]),
          404: z.object({
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
        const { barcode } = req.params;
        const { page, pageSize } = req.query;
        const { id } = req.user;

        const product = await storeProductService.findByBarcode(
          barcode,
          id,
          page,
          pageSize
        )

        if (!product) {
          return reply.status(404).send({
            error: "Produto não encontrado",
          });
        }

        // Se for um array (lista de produtos customizados), retorna direto
        if (
          product &&
          typeof product === "object" &&
          (product as any).products &&
          Array.isArray((product as any).products)
        ) {
          const customList = product as any;
          console.log(
            "✅ Lista de produtos customizados retornada:",
            customList
          );

        


          return reply.status(200).send({
            products: customList.products.map((p: any) => ({
              id: p.id ?? "",
              name: p.name ?? "",
              price: p.price ?? 0,
              quantity: p.quantity ?? 0,
              brand: p.brand ?? "",
              imgUrl: p.imgUrl ?? null,
              company: p.company ?? "",
              category: p.category ?? "",
              status: (p.status ?? "active") as "active" | "inactive",
            })),
            pagination: {
              page: customList.page,
              pageSize: customList.pageSize,
              total: customList.total,
            },
          });
        }

        // Se for um único produto, serializa
        if (product && typeof product === "object") {
          const serializedProduct = {
            id: product.id ?? "",
            name: product.name ?? "",
            price: product.price ?? 0,
            quantity: product.quantity ?? 0,
            brand: product.brand ?? "",
            company: product.company ?? "",
            imgUrl: product.imgUrl || "",
            category: product.category || "",
            status: (product.status || "active") as "active" | "inactive",
          };
          return reply.status(200).send(serializedProduct);
        }

        // Caso o retorno seja inesperado
        console.error(
          "[ERRO] Formato inesperado retornado por findByBarcode:",
          product
        );
        return reply.status(500).send({
          error:
            "Formato inesperado retornado por findByBarcode. Consulte os logs para detalhes.",
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar produto por código de barras:", error);
        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );
}
