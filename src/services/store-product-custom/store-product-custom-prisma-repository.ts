import { Prisma } from "@/generated/prisma/client";
import {
  LinkedProductInput,
  LinkedProductItem,
  StoreProductCustomRepository,
} from "./store-product-custom-repository";
import { StoreProductEntity } from "@/entities/store-products";
import { prisma } from "@/lib/prisma";

export class StoreProductCustomPrismaRepository
  implements StoreProductCustomRepository
{
  constructor() {}

  async create(
    data: StoreProductEntity,
    linkedItems?: LinkedProductInput[]
  ): Promise<StoreProductEntity> {
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
        linkedItems:
          linkedItems && linkedItems.length > 0
            ? {
                create: linkedItems.map((item) => ({
                  storeProductId: item.storeProductId,
                  quantity: item.quantity,
                })),
              }
            : undefined,
      },
    });

    return new StoreProductEntity(product);
  }

  async setLinkedItems(
    customProductId: string,
    items: LinkedProductInput[]
  ): Promise<void> {
    await prisma.$transaction([
      prisma.storeProductCustomItem.deleteMany({
        where: { storeProductCustomId: customProductId },
      }),
      prisma.storeProductCustomItem.createMany({
        data: items.map((item) => ({
          storeProductCustomId: customProductId,
          storeProductId: item.storeProductId,
          quantity: item.quantity,
        })),
      }),
    ]);
  }

  async getLinkedItems(customProductId: string): Promise<LinkedProductItem[]> {
    const items = await prisma.storeProductCustomItem.findMany({
      where: { storeProductCustomId: customProductId },
      include: { storeProduct: true },
    });

    return items.map((item) => ({
      id: item.id,
      storeProductId: item.storeProductId,
      quantity: item.quantity,
      product: new StoreProductEntity(item.storeProduct),
    }));
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

    // ✅ Sem estoque não é mais excluído, apenas ordenado por último
    const stockOrderSql = Prisma.sql`CASE WHEN "quantity" > 0 THEN 0 ELSE 1 END ASC`;

    const conditions: Prisma.Sql[] = [Prisma.sql`"storeId" = ${storeId}`];

    if (query) {
      conditions.push(Prisma.sql`"name" ILIKE ${`%${query}%`}`);
    }

    if (category) {
      conditions.push(Prisma.sql`"category" ILIKE ${`%${category}%`}`);
    }

    if (status) {
      conditions.push(Prisma.sql`"status" = ${status}`);
    }

    const whereSql = Prisma.join(conditions, " AND ");

    const products = await prisma.$queryRaw<any[]>`
      SELECT * FROM "store_product_customs"
      WHERE ${whereSql}
      ORDER BY ${stockOrderSql}, "createdAt" DESC
      OFFSET ${skip} LIMIT ${take};
    `;

    const [{ count: total }] = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int AS count FROM "store_product_customs" WHERE ${whereSql};
    `;

    if (query && total === 0) {
      console.log("Tentando busca fuzzy para produtos custom");

      try {
        const fuzzyConditions: Prisma.Sql[] = [Prisma.sql`"storeId" = ${storeId}`];

        if (category) {
          fuzzyConditions.push(Prisma.sql`"category" ILIKE ${`%${category}%`}`);
        }

        if (status) {
          fuzzyConditions.push(Prisma.sql`"status" = ${status}`);
        }

        const fuzzyWhereSql = Prisma.join(fuzzyConditions, " AND ");

        // word_similarity lida melhor com queries parciais/typo do que similarity,
        // pois compara contra a melhor substring do nome, não a string inteira
        const fuzzyRows = await prisma.$queryRaw<any[]>`
        WITH scored AS (
          SELECT *, word_similarity(lower(${query}), lower("name")) AS score
          FROM "store_product_customs"
          WHERE ${fuzzyWhereSql}
        )
        SELECT * FROM scored
        WHERE score > 0.2
        ORDER BY ${stockOrderSql}, score DESC, "createdAt" DESC
        OFFSET ${skip} LIMIT ${take};
      `;

        const [{ count }] = await prisma.$queryRaw<any[]>`
        WITH scored AS (
          SELECT word_similarity(lower(${query}), lower("name")) AS score
          FROM "store_product_customs"
          WHERE ${fuzzyWhereSql}
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
      } catch (e) {
        console.error("Fuzzy search (produtos custom) failed:", e);
      }
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

  async countLowStock(storeId: string, limit: number): Promise<number> {
    const count = await prisma.storeProductCustom.count({
      where: {
        storeId,
        quantity: {
          lte: limit,
        },
      },
    });
    return count; 
  }
}
