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

  async count(query?: string): Promise<number> {
    return prisma.catalog.count({
      where: query
        ? {
            name: { contains: query, mode: "insensitive" },
          }
        : {},
    });
  }

  async create(data: { name: string; brand?: string; company?: string; category?: string; priceSuggested?: number; priceNormal?: number; barcode: string; image?: string; }): Promise<void> {
    await prisma.catalog.create({
      data:{
        category: data.category,
        name: data.name,
        brand: data.brand,
        company: data.company,
        suggestedPrice: data.priceSuggested,
        normalPrice: data.priceNormal,
        barcode: data.barcode,
        imgUrl: data.image,
      }
    });
  }
}
