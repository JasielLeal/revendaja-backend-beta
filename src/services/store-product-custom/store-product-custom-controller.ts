import { FastifyTypeInstance } from "@/types/fastify-instance";
import { verifyToken } from "@/middlewares/verify-token";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { StoreProductCustomPrismaRepository } from "./store-product-custom-prisma-repository";
import { StoreProductCustomService } from "./store-product-custom-service";
import { StoreProductPrismaRepository } from "../store-product/store-product-prisma-repository";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { CheckPlanLimits } from "@/middlewares/check-plan-limits";

export async function StoreProductCustomController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const storeProductCustomRepository = new StoreProductCustomPrismaRepository();
  const storeProductRepository = new StoreProductPrismaRepository();

  const service = new StoreProductCustomService(
    storeProductCustomRepository,
    storeRepository,
    storeProductRepository
  );

  app.post(
    "/store-products-custom",
    {
      preHandler: [verifyToken, CheckPlanLimits],
      schema: {
        tags: ["Store-Products-Custom"],
        description: "Create a custom product for the store",
        consumes: ["multipart/form-data"],
        response: {
          201: z.object({
            message: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          413: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const userPlan = request.user.plan;

        let bodyRaw: any = null;

        // 🔥 LEITURA CORRETA DO MULTIPART
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType: string | null = null;
        for await (const part of parts) {

          if (part.type === "field" && part.fieldname === "body") {
            try {
              bodyRaw = JSON.parse(part.value as string);
            } catch {
              return reply.status(400).send({
                message: "Body inválido (JSON malformado)",
              });
            }
          }

          if (part.type === "file") {
            // logs para diagnosticar problemas vindos da galeria
            console.log("Upload file:", { filename: part.filename, mimetype: part.mimetype });

            // Alguns dispositivos/clients podem enviar arquivos sem mimetype
            // ou com mimetype genérico. Aceitamos também por extensão comum.
            const filename = part.filename || "";
            const ext = filename.split('.').pop()?.toLowerCase() || "";
            const allowedExts = ["jpg", "jpeg", "png", "gif", "heic", "heif", "webp"];

            if (!(part.mimetype && part.mimetype.startsWith("image/")) && !allowedExts.includes(ext)) {
              return reply.status(400).send({
                message: "Invalid image type or missing mimetype. Envie JPG/PNG/HEIC/WEBP",
              });
            }

            fileBuffer = await part.toBuffer(); // 🔥 CONSUME O STREAM
            fileMimeType = part.mimetype || (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : undefined);

            console.log("Received file size:", fileBuffer.length);
            // Segurança: rejeitar se exceder limite razoável (definido também no server)
            const maxSize = 5 * 1024 * 1024; // 5 MB
            if (fileBuffer.length > maxSize) {
              return reply.status(413).send({ message: "Image too large (max 5MB)" });
            }
          }
        }

        if (!bodyRaw) {
          return reply.status(400).send({
            message: "Body não enviado",
          });
        }

        // ✅ ZOD APLICADO MANUALMENTE (SEM CONFLITO)
        const bodySchema = z.object({
          name: z.string().min(1),
          price: z.number().min(0.01),
          quantity: z.number().min(0),
          costPrice: z.number().optional(),
          category: z.string().optional(),
          linkedProducts: z
            .array(
              z.object({
                storeProductId: z.string().min(1),
                quantity: z.number().min(1),
              })
            )
            .optional(),
        });

        const { name, price, quantity, costPrice, category, linkedProducts } =
          bodySchema.parse(bodyRaw);

        let imgUrl: string | undefined;

        // 📌 Upload da imagem (opcional)
        if (fileBuffer && fileMimeType) {
          const hash = uuidv4();
          const key = `stores/${name
            .replace(/\s+/g, "")
            .toLowerCase()}-${hash}`;

          await s3.send(
            new PutObjectCommand({
              Bucket: 'revendaja-develop',
              Key: key,
              Body: fileBuffer,
              ContentType: fileMimeType,
              ACL: "public-read" as const,
            })
          );

          imgUrl = `https://revendaja-develop.s3.amazonaws.com/${key}`;
        }

        await service.createCustomProduct(
          {
            name,
            price,
            quantity,
            costPrice,
            imgUrl,
            category,
            linkedProducts,
          },
          userId,
          userPlan
        );

        return reply.status(201).send({
          message: "Custom product created successfully",
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Store not found") {
            return reply.status(404).send({
              message: "Store not found",
            });
          }
        }

        console.error(error);

        return reply.status(500).send({
          message: "Internal Server Error",
        });
      }
    }
  );

  app.get(
    "/store-products-custom/:id/linked-products",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Store-Products-Custom"],
        description: "Get linked products (kit items) of a custom product",
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            linkedProducts: z.array(
              z.object({
                id: z.string(),
                storeProductId: z.string(),
                quantity: z.number(),
                product: z.any(),
              })
            ),
          }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;

        const linkedProducts = await service.getLinkedProducts(id, userId);

        return reply.status(200).send({ linkedProducts });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === "Store not found" ||
            error.message === "Custom product not found"
          ) {
            return reply.status(404).send({ message: error.message });
          }
        }

        console.error(error);

        return reply.status(500).send({
          message: "Internal Server Error",
        });
      }
    }
  );

  app.put(
    "/store-products-custom/:id/linked-products",
    {
      preHandler: [verifyToken],
      schema: {
        tags: ["Store-Products-Custom"],
        description: "Update linked products (kit items) of a custom product",
        params: z.object({ id: z.string() }),
        body: z.object({
          linkedProducts: z.array(
            z.object({
              storeProductId: z.string().min(1),
              quantity: z.number().min(1),
            })
          ),
        }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;
        const { id } = request.params;
        const { linkedProducts } = request.body;

        await service.updateLinkedProducts(id, userId, linkedProducts);

        return reply.status(200).send({
          message: "Linked products updated successfully",
        });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === "Store not found" ||
            error.message === "Custom product not found"
          ) {
            return reply.status(404).send({ message: error.message });
          }

          if (error.message.startsWith("Linked product")) {
            return reply.status(400).send({ message: error.message });
          }
        }

        console.error(error);

        return reply.status(500).send({
          message: "Internal Server Error",
        });
      }
    }
  );
}
