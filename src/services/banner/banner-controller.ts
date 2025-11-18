import z from "zod";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { BannerService } from "./banner-service";

export async function BannerController(app: FastifyTypeInstance) {
  // Listar todos os banners disponíveis
  app.get(
    "/banners",
    {
      schema: {
        tags: ["Banners"],
        description: "Get all available banners",
        querystring: z.object({
          category: z.string().optional(),
        }),
        response: {
          200: z.object({
            banners: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                url: z.string(),
                category: z.string(),
                previewUrl: z.string(),
              })
            ),
            categories: z.array(z.string()),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { category } = req.query;

        const banners = category
          ? BannerService.getBannersByCategory(category)
          : BannerService.getAllBanners();

        const categories = BannerService.getCategories();

        return reply.status(200).send({
          banners,
          categories,
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar banners:", error);
        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Obter categorias de banners
  app.get(
    "/banners/categories",
    {
      schema: {
        tags: ["Banners"],
        description: "Get banner categories",
        response: {
          200: z.object({
            categories: z.array(z.string()),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const categories = BannerService.getCategories();

        return reply.status(200).send({
          categories,
        });
      } catch (error: any) {
        console.log("❌ ERRO ao buscar categorias:", error);
        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Obter detalhes de um banner específico
  app.get(
    "/banners/:id",
    {
      schema: {
        tags: ["Banners"],
        description: "Get banner details",
        params: z.object({
          id: z.string().min(1),
        }),
        response: {
          200: z.object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            category: z.string(),
            previewUrl: z.string(),
          }),
          404: z.object({
            error: z.string().default("Banner not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { id } = req.params;

        const banner = BannerService.getBannerById(id);

        if (!banner) {
          return reply.status(404).send({
            error: "Banner não encontrado",
          });
        }

        return reply.status(200).send(banner);
      } catch (error: any) {
        console.log("❌ ERRO ao buscar banner:", error);
        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );
}
