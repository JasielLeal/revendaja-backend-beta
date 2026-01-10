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
        return reply.status(200).send(availability);
      } catch (err: any) {
        return reply.status(500).send({ error: err.message });
      }
    }
  );
}
