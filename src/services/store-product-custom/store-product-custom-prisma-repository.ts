import { StoreProductCustomRepository } from "./store-product-custom-repository";
import { StoreProductEntity } from "@/entities/store-products";
import { prisma } from "@/lib/prisma";

export class StoreProductCustomPrismaRepository
  implements StoreProductCustomRepository
{
  constructor() {}

  async create(data: StoreProductEntity): Promise<StoreProductEntity> {
    const product = await prisma.storeProductCustom.create({
      data: {
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        imgUrl: data.imgUrl,
        storeId: data.storeId,
        barcode: data.barcode,
        brand: data.brand,
        company: data.company,
        category: data.category,
        cost_price: data.costPrice,
      },
    });

    return new StoreProductEntity(product);
  }

  async findById(id: string): Promise<StoreProductEntity | null> {
    const product = await prisma.storeProductCustom.findUnique({
      where: { id },
    });

    if (!product) return null;

    return new StoreProductEntity(product);
  }

  async findAllByStoreId(
    storeId: string,
    page?: number,
    pageSize?: number,
    query?: string,
    category?: string,
    status?: string
  ): Promise<{
    products: StoreProductEntity[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    usedFuzzy: boolean;
  }> {
    page = page || 1;
    pageSize = pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    console.log("Query que chega nos produtos custom:", query);

    const where: any = {
      storeId,
      // ✅ Removido filtro de status - agora lista TODOS os produtos (ativos e inativos)
    };

    if (query) {
      where.OR = [{ name: { contains: query, mode: "insensitive" } }];
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    const products = await prisma.storeProductCustom.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.storeProductCustom.count({
      where,
    });

    if (query && total === 0) {
      console.log("Tentando busca fuzzy para produtos custom");

      try {
        const fuzzyRows = await prisma.$queryRaw<any[]>`
        WITH scored AS (
          SELECT *, similarity(lower("name"), lower(${query})) AS score
          FROM "store_product_customs"
          WHERE "storeId" = ${storeId}
        )
        SELECT * FROM scored
        WHERE score > 0.2
        ORDER BY score DESC, "createdAt" DESC
        OFFSET ${skip} LIMIT ${take};
      `;

        const [{ count }] = await prisma.$queryRaw<any[]>`
        WITH scored AS (
          SELECT similarity(lower("name"), lower(${query})) AS score
          FROM "store_product_customs"
          WHERE "storeId" = ${storeId}
        )
        SELECT COUNT(*)::int AS count FROM scored WHERE score > 0.2;
      `;

        return {
          products: fuzzyRows,
          pagination: {
            page: page,
            pageSize: pageSize,
            total: count,
            totalPages: Math.ceil((count as number) / pageSize),
          },
          usedFuzzy: true,
        };
      } catch {}
    }

    return {
      products,
      pagination: {
        page: page,
        pageSize: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      usedFuzzy: false,
    };
  }

  async updatedStock(productId: string, newQuantity: number): Promise<void> {
    await prisma.storeProductCustom.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });
  }

  async updatePrice(productId: string, newPrice: number): Promise<void> {
    await prisma.storeProductCustom.update({
      where: {
        id: productId,
      },
      data: {
        price: newPrice,
      },
    });

    return;
  }

  async updateStatus(productId: string, status: string): Promise<void> {
    await prisma.storeProductCustom.update({
      where: {
        id: productId,
      },
      data: {
        status: status,
      },
    });

    return;
  }

  async updateValidityDate(
    productId: string,
    newValidityDate: Date
  ): Promise<void> {
    await prisma.storeProductCustom.update({
      where: {
        id: productId,
      },
      data: {
        validity_date: newValidityDate,
      },
    });

    return;
  }

  async updateCostPrice(
    productId: string,
    newCostPrice: number
  ): Promise<void> {
    await prisma.storeProductCustom.update({
      where: {
        id: productId,
      },
      data: {
        cost_price: newCostPrice,
      },
    });

    return;
  }

  async getUniqueCategories(storeId: string): Promise<string[]> {
    const categories = await prisma.storeProductCustom.findMany({
      where: {
        storeId,
        status: "active",
      },
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return categories
      .map((item) => item.category)
      .filter((category): category is string => category !== null);
  }

  async countActiveProducts(storeId: string): Promise<number> {
    return prisma.storeProductCustom.count({
      where: {
        storeId,
      },
    });
  }
}
