import { FastifyTypeInstance } from "@/types/fastify-instance";
import { StorePrismaRepository } from "./store-prisma-repository";
import { StoreService } from "./store-service";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";
import { Plan } from "@/config/plans";
import { OrderPrismaRepository } from "../order/order-prisma-repository";
import { StoreProductPrismaRepository } from "../store-product/store-product-prisma-repository";
import { PlanLimitsService } from "@/lib/plan-limits";
import { StoreProductCustomPrismaRepository } from "../store-product-custom/store-product-custom-prisma-repository";
import { BannerPrismaRepository } from "../banner/banner-prisma-repository";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function StoreController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const userRepository = new UserPrismaRepository();
  const orderRepository = new OrderPrismaRepository();
  const storeProductCustomRepository = new StoreProductCustomPrismaRepository();
  const storeProductRepository = new StoreProductPrismaRepository();
  const bannerRepository = new BannerPrismaRepository();
  const storeService = new StoreService(storeRepository, userRepository, bannerRepository);
  const planLimitsService = new PlanLimitsService(
    orderRepository,
    storeProductRepository,
    storeProductCustomRepository
  );

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
          primaryColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/)
            .optional(),
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
        const { name, address, phone, primaryColor } = req.body;
        const userId = req.user.id;

        console.log("Creating store for user ID:", userId);
        console.log("Store details:", { name, address, phone, primaryColor });

        const store = await storeService.createStore(
          {
            name,
            address,
            phone,
            primaryColor,
            subdomain: "",
            userId: "",
            bannerId: "4972ab5b-fa9e-447c-bdae-8ec41e53640e",


          },
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

  app.get(
    "/stores/me",
    {
      schema: {
        tags: ["Stores"],
        description: "Get store by user ID",
        response: {
          200: z.object({
            id: z.string().optional(),
            name: z.string(),
            address: z.string(),
            phone: z.string(),
            subdomain: z.string(),
            primaryColor: z.string(),
            bannerUrl: z.string().optional(),
            userId: z.string(),
            logo: z.string().optional().nullable(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const userId = req.user.id;
        const store = await storeService.findStoreByUserId(userId);

        console.log(store)

        if (!store) {
          return reply.status(404).send({ error: "Store not found" });
        }
        return reply.status(200).send({
          id: store.id,
          name: store.name,
          address: store.address,
          phone: store.phone,
          subdomain: store.subdomain ?? "",
          primaryColor: store.primaryColor || "#fc5800",
          bannerUrl: store.bannerUrl,
          userId: store.userId,
          logo: store.logo,
        });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  // Atualizar cor primária da loja
  app.patch(
    "/stores/me/primary-color",
    {
      schema: {
        tags: ["Stores"],
        description: "Update store primary color",
        body: z.object({
          primaryColor: z
            .string()
            .regex(
              /^#[0-9A-Fa-f]{6}$/,
              "Primary color must be a valid hex color"
            ),
        }),
        response: {
          200: z.object({
            Success: z.string(),
            Code: z.string(),
            message: z.string(),
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
        const { primaryColor } = req.body;
        const userId = req.user.id;

        await storeService.updatePrimaryColor(userId, primaryColor);

        return reply.status(200).send({
          Success: "True",
          Code: "200",
          message: "Primary color updated successfully",
        });
      } catch (err: any) {
        if (err.message.includes("not found")) {
          return reply.status(404).send({ error: "Store not found" });
        }
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  // Endpoint para consultar uso do plano
  app.get(
    "/stores/plan-usage",
    {
      schema: {
        tags: ["Stores"],
        description: "Get current plan usage information",
        response: {
          200: z.object({
            plan: z.string(),
            limits: z.object({
              monthlyOrders: z.number(),
              maxProducts: z.number(),
              canUseOnlineStore: z.boolean(),
              canUseWhatsappIntegration: z.boolean(),
              canExportReports: z.boolean(),
              prioritySupport: z.boolean(),
            }),
            usage: z.object({
              monthlyOrders: z.number(),
              totalProducts: z.number(),
            }),
            remaining: z.object({
              monthlyOrders: z.union([z.number(), z.literal("unlimited")]),
              products: z.union([z.number(), z.literal("unlimited")]),
            }),
          }),
          401: z.object({
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
        const userId = req.user.id;
        const userPlan = (req.user.plan || "Free") as Plan;

        const store = await storeRepository.findyStoreByUserId(userId);

        if (!store) {
          return reply.status(404).send({ error: "Store not found" });
        }

        const usageInfo = await planLimitsService.getUsageInfo(
          store.id,
          userPlan
        );

        console.log("Usage Info:", usageInfo);

        return reply.status(200).send(usageInfo);
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  // Endpoint para verificar disponibilidade do domínio da loja
  app.get(
    "/stores/domain-availability/:domain",
    {
      schema: {
        tags: ["Stores"],
        description: "Check store domain availability",
        params: z.object({
          domain: z.string().min(1),
        }),
        response: {
          200: z.object({
            available: z.boolean(),
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
        const { domain } = req.params;
        const availability = await storeService.verifyDisponibilityTheDomainStore(
          domain
        );

        console.log("Domain availability for", domain, ":", availability);

        return reply.status(200).send(availability);
      } catch (err: any) {
        if (err.message.includes("Domain already in use")) {
          return reply.status(400).send({
            error: "Domain already in use"
          });
        }
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  app.patch(
    "/stores/me",
    {

      schema: {
        tags: ["Stores"],
        description: "Update store information",
        body: z.object({
          name: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().optional()
          ),
          address: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().optional()
          ),
          phone: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().optional()
          ),
          primaryColor: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z
              .string()
              .regex(
                /^#[0-9A-Fa-f]{6}$/,
                "Primary color must be a valid hex color"
              )
              .optional()
          ),
        }),
        response: {
          200: z.object({
            Success: z.string(),
            Code: z.string(),
            message: z.string(),
          }),
          403: z.object({
            error: z.string().default("Subdomain already in use"),
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
        const { name, address, phone, primaryColor } = req.body;
        const userId = req.user.id;
        await storeService.updateStoreInformation(userId, {
          name,
          address,
          phone,
          primaryColor,
        });
        return reply.status(200).send({
          Success: "True",
          Code: "200",
          message: "Store information updated successfully",
        });
      }
      catch (err: any) {
        if (err.message.includes("not found")) {
          return reply.status(404).send({ error: "Store not found" });
        }
        if (err.message.includes("Subdomain already in use")) {
          return reply.status(403).send({ error: "Subdomain already in use" });
        }
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  app.get(
    "/stores/me/settings",
    {
      schema: {
        tags: ["Stores"],
        description: "Get store settings",
        response: {
          200: z.object({
            pixKey: z.string(),
            pixName: z.string(),
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
        const userId = req.user.id;
        const settings = await storeService.getStoreSettings(userId);

        if (!settings) {
          return reply.status(404).send({ error: "Store settings not found" });
        }

        return reply.status(200).send(settings);
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  app.post(
    "/stores/me/settings/create-default",
    {
      schema: {
        tags: ["Stores"],
        description: "Create default store settings",
        body: z.object({
          pixKey: z.string().min(1),
          pixName: z.string().min(1),
        }),
        response: {
          201: z.object({
            Success: z.string(),
            Code: z.string(),
            message: z.string(),
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
        const { pixKey, pixName } = req.body;
        const userId = req.user.id;
        const store = await storeRepository.findyStoreByUserId(userId);
        if (!store) {
          return reply.status(404).send({ error: "Store not found" });
        }
        await storeService.createDefaultStoreSettings(store.id!, pixKey, pixName);
        return reply.status(201).send({
          Success: "True",
          Code: "201",
          message: "Default store settings created successfully",
        });
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  app.patch(
    "/stores/me/settings",
    {
      schema: {
        tags: ["Stores"],
        description: "Update store settings",
        body: z.object({
          pixKey: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().optional()
          ),
          pixName: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().optional()
          ),
        }),
        response: {
          200: z.object({
            Success: z.string(),
            Code: z.string(),
            message: z.string(),
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
        const { pixKey, pixName } = req.body;
        const userId = req.user.id;
        await storeService.updateStoreSettings(userId, { pixKey, pixName });
        return reply.status(200).send({
          Success: "True",
          Code: "200",
          message: "Store settings updated successfully",
        });
      } catch (err: any) {
        if (err.message.includes("not found")) {
          return reply.status(404).send({ error: err.message });
        }
        return reply.status(500).send({ error: err.message });
      }
    }
  );

  app.post(
    "/stores/me/branding",
    {
      schema: {
        tags: ["Stores"],
        description: "Update store branding (logo and primary color)",
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
      preHandler: [verifyToken],
    },
    async (request, reply) => {
      try {
        let bodyRaw: Record<string, any> | null = null;

        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let fileMimeType: string | null = null;
        const userId = request.user.id;

        for await (const part of parts) {

          if (part.type === "field") {
            if (!bodyRaw) bodyRaw = {};

            if (part.fieldname === "body") {
              try {
                bodyRaw = JSON.parse(part.value as string);
                console.log("bodyRaw parsed:", bodyRaw);
              } catch {
                return reply.status(400).send({
                  message: "Body inválido (JSON malformado)",
                });
              }
            } else {
              bodyRaw[part.fieldname] = part.value;
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

            // Segurança: rejeitar se exceder limite razoável (definido também no server)
            const maxSize = 5 * 1284 * 1284; // 5 MB
            if (fileBuffer.length > maxSize) {
              
              return reply.status(413).send({ message: "Image too large (max 5MB)" });
            }
          }
        }

        if (fileBuffer) {
          console.log("File large:", fileBuffer.length);
        }
        console.log("bodyRaw:", bodyRaw);

        if (!bodyRaw || Object.keys(bodyRaw).length === 0) {
          return reply.status(400).send({
            message: "Body não enviado",
          });
        }

        console.log("Parsed body:", bodyRaw);

        const bodySchema = z.object({
          primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color").optional(),
          storeName: z.string().optional(),
        })

        const { primaryColor, storeName } = bodySchema.parse(bodyRaw);

        let imgUrl: string | undefined;

        // 📌 Upload da imagem (opcional)
        if (fileBuffer && fileMimeType) {
          const hash = uuidv4();
          const key = `stores-logos/${storeName
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

        await storeService.updateAppareance(userId, primaryColor, imgUrl);

        return reply.status(201).send({
          message: "Store branding updated successfully",
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
  )
};