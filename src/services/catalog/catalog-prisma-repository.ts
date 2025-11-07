import { CatalogEntity } from "@/entities/catalog-entity";
import { CatalogRepository } from "./catalog-repository";
import { prisma } from "@/lib/prisma";

export class CatalogPrismaRepository implements CatalogRepository {
  async findById(catalogId: number): Promise<null | CatalogEntity> {
    const catalogProduct = await prisma.catalog.findUnique({
      where: {
        id: catalogId,
      },
    });

    return catalogProduct;
  }

  async findAll(page: number, pageSize: number, query?: string) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const catalog = await prisma.catalog.findMany({
      where: query
        ? {
            name: { contains: query, mode: "insensitive" },
          }
        : {},
      skip,
      take,
    });

    return catalog;
  }
}
