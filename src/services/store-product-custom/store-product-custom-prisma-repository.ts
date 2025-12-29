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
    query?: string
  ): Promise<{
    products: StoreProductEntity[];
    pagination: { page: number; pageSize: number; total: number };
  }> {
    page = page || 1;
    pageSize = pageSize || 20;

    const where: any = {
      storeId,
      // ✅ Removido filtro de status - agora lista TODOS os produtos (ativos e inativos)
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
      ];
    }

    const products = await prisma.storeProductCustom.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.storeProductCustom.count({
      where,
    });

    return {
      products,
      pagination:{
        page: page,
        pageSize: pageSize,
        total,
      }

    };
  }

  async updatedStock(productId: string, newQuantity: number): Promise<void> {
    await prisma.storeProductCustom.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });
  }
}
