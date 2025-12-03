import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { BannerService } from "./banner-service";
import { verifyToken } from "@/middlewares/verify-token";
import { BannerPrismaRepository } from "./banner-prisma-repository";

export async function BannerController(app: FastifyTypeInstance) {
  const bannerRepository = new BannerPrismaRepository();
  const bannerService = new BannerService(bannerRepository);

  // Instanciar o BannerService
  app.post(
    "/banners",
    {
      schema: {
        tags: ["Banners"],
        description: "Create a new banner",
        body: z.object({
          mobile_url: z.string().url(),
          desktop_url: z.string().url(),
          text: z.string().optional(),
        }),
        response: {
          201: z.object({
            id: z.string(),
            mobile_url: z.string().url(),
            desktop_url: z.string().url(),
            text: z.string().optional(),
            createdAt: z.string(),
            updatedAt: z.string(),
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
    async (request, reply) => {
      try {
        const { desktop_url, mobile_url, text } = request.body;
        await bannerService.createBanner({
          desktop_url,
          mobile_url,
          text,
        });
        return reply.status(201).send();
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}
