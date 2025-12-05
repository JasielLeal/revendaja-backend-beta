import { FastifyTypeInstance } from "@/types/fastify-instance";
import { StorePrismaRepository } from "./store-prisma-repository";
import { StoreService } from "./store-service";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import z from "zod";
import { verifyToken } from "@/middlewares/verify-token";

export async function StoreController(app: FastifyTypeInstance) {
  const storeRepository = new StorePrismaRepository();
  const userRepository = new UserPrismaRepository();
  const storeService = new StoreService(storeRepository, userRepository);

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

        const store = await storeService.createStore(
          { name, address, phone, primaryColor, subdomain: "", userId: "", bannerId: '2e173f00-7b7d-4082-ba19-22b8be5a9b16' },
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

  // Atualizar banner da loja
  // app.patch(
  //   "/stores/me/banner",
  //   {
  //     schema: {
  //       tags: ["Stores"],
  //       description: "Update store banner",
  //       body: z.object({
  //         bannerId: z.string().min(1, "Banner ID is required"),
  //       }),
  //       response: {
  //         200: z.object({
  //           Success: z.string(),
  //           Code: z.string(),
  //           message: z.string(),
  //         }),
  //         400: z.object({
  //           error: z.string(),
  //         }),
  //         404: z.object({
  //           error: z.string(),
  //         }),
  //         500: z.object({
  //           error: z.string(),
  //         }),
  //       },
  //     },
  //     preHandler: [verifyToken],
  //   },
  //   async (req, reply) => {
  //     try {
  //       const { bannerId } = req.body;
  //       const userId = req.user.id;

  //       await storeService.updateBanner(userId, bannerId);

  //       return reply.status(200).send({
  //         Success: "True",
  //         Code: "200",
  //         message: "Banner updated successfully",
  //       });
  //     } catch (err: any) {
  //       if (err.message.includes("not found")) {
  //         return reply.status(404).send({ error: "Store not found" });
  //       }
  //       if (err.message.includes("Invalid banner")) {
  //         return reply.status(400).send({ error: "Invalid banner ID" });
  //       }
  //       return reply.status(500).send({ error: err.message });
  //     }
  //   }
  // );
}
