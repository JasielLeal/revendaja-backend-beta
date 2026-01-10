import { FastifyTypeInstance } from "@/types/fastify-instance";
import { CatalogPrismaRepository } from "./catalog-prisma-repository";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { CatalogService } from "./catalog-service";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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
          page: z
            .string()
            .optional()
            .default("1")
            .transform((val) => parseInt(val, 10))
            .pipe(z.number().min(1)),
          pageSize: z
            .string()
            .optional()
            .default("10")
            .transform((val) => parseInt(val, 10))
            .pipe(z.number().min(1).max(100)),
          query: z.string().optional(),
        }),
        response: {
          200: z.object({
            products: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                price: z.number(),
                image: z.string().nullable().optional(),
                brand: z.string().nullable().optional(),
                company: z.string().nullable().optional(),
                // adicione outros campos se quiser
              })
            ),
            page: z.number(),
            pageSize: z.number(),
            totalProducts: z.number(),
            totalPages: z.number(),
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
        const { page, pageSize, query } = req.query;

        const userId = req.user.id;

        const result = await catalogService.getAll(
          userId,
          page,
          pageSize,
          query
        );
        return reply.status(200).send({
          products: result.products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.normalPrice,
            image: product.imgUrl,
            brand: product.brand,
            company: product.company,
          })),
          page,
          pageSize,
          totalProducts: result.pagination.totalProducts,
          totalPages: result.pagination.totalPages,
        });
      } catch (error: any) {
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

  app.post(
    "/catalog/create",
    {
      schema: {
        tags: ["Catalog"],
        description: "Create a new catalog product",
        consumes: ["multipart/form-data"],
        response: {
          200: z.object({
            message: z.string(),
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
        let bodyRaw: Record<string, any> = {};

        const parts = req.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType: string | null = null;

        console.log("Acessando partes do multipart...");

        for await (const part of parts) {
          if (part.type === "field") {
            bodyRaw[part.fieldname] = part.value;
          }

          if (part.type === "file") {
            if (!part.mimetype.startsWith("image/")) {
              return reply.status(400).send({
                error: "Invalid image type",
              });
            }

            fileBuffer = await part.toBuffer();
            fileMimeType = part.mimetype;
          }
        }

        console.log("bodyRaw:", bodyRaw);

        if (!bodyRaw || Object.keys(bodyRaw).length === 0) {
          return reply.status(400).send({
            error: "Body is required",
          });
        }

        console.log("Body received:", bodyRaw);
        console.log("File received:", fileBuffer);

        const bodySchema = z.object({
          name: z.string().min(1),
          brand: z.string(),
          company: z.string(),
          category: z.string(),
          priceSuggested: z.string().transform(Number),
          priceNormal: z.string().transform(Number),
          barcode: z.string().min(1),
        });

        const {
          barcode,
          brand,
          category,
          company,
          name,
          priceNormal,
          priceSuggested,
        } = bodySchema.parse(bodyRaw);

        let imgUrl: string | undefined;

        if (fileBuffer && fileMimeType) {
          const key = `produtos/${name.replace(/\s+/g, "")}`;

          await s3.send(
            new PutObjectCommand({
              Bucket: "revendaja",
              Key: key,
              Body: fileBuffer, // ✅ BUFFER
              ContentType: fileMimeType,
              ACL: "public-read",
            })
          );

          imgUrl = `https://revendaja.s3.amazonaws.com/${key}`;
        }

        await catalogService.create({
          name,
          brand,
          company,
          category,
          priceSuggested,
          priceNormal,
          barcode,
          image: imgUrl,
        });

        return reply.status(200).send({
          message: "Produto criado com sucesso",
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error:
              "Dados inválidos: " +
              error.issues.map((e) => e.message).join(", "),
          });
        }

        return reply.status(500).send({
          error: "Erro ao criar produto: " + error.message,
        });
      }
    }
  );
}
