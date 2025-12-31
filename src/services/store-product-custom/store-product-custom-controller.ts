import { FastifyTypeInstance } from "@/types/fastify-instance";
import { verifyToken } from "@/middlewares/verify-token";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { StoreProductCustomPrismaRepository } from "./store-product-custom-prisma-repository";
import { StoreProductCustomService } from "./store-product-custom-service";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { CheckPlanLimits } from "@/middlewares/check-plan-limits";

export async function StoreProductCustomController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const storeProductCustomRepository = new StoreProductCustomPrismaRepository();

  const service = new StoreProductCustomService(
    storeProductCustomRepository,
    storeRepository
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

        let file: any = null;
        let bodyRaw: any = null;

        // 🔥 LEITURA CORRETA DO MULTIPART
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType: string | null = null;
        for await (const part of parts) {

          if (part.type === "field" && part.fieldname === "body") {
            try {
              bodyRaw = JSON.parse(part.value as string);
              ;
            } catch {
              return reply.status(400).send({
                message: "Body inválido (JSON malformado)",
              });
            }
          }

          if (part.type === "file") {
            if (!part.mimetype.startsWith("image/")) {
              return reply.status(400).send({
                message: "Invalid image type",
              });
            }

            fileBuffer = await part.toBuffer(); // 🔥 CONSUME O STREAM
            fileMimeType = part.mimetype;
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
        });

        const { name, price, quantity, costPrice, category } = bodySchema.parse(bodyRaw);

        let imgUrl: string | undefined;

        console.log(file);

        // 📌 Upload da imagem (opcional)
        if (fileBuffer && fileMimeType) {
          const hash = uuidv4();
          const key = `stores/${name
            .replace(/\s+/g, "")
            .toLowerCase()}-${hash}`;

          await s3.send(
            new PutObjectCommand({
              Bucket: 'revendaja',
              Key: key,
              Body: fileBuffer,
              ContentType: fileMimeType,
              ACL: "public-read" as const,
            })
          );

          imgUrl = `https://revendaja.s3.amazonaws.com/${key}`;
        }

        await service.createCustomProduct(
          {
            name,
            price,
            quantity,
            costPrice,
            imgUrl,
            category
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
}
