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
    pageSize?: number
  ): Promise<StoreProductEntity[]> {
    const products = await prisma.storeProductCustom.findMany({
      where: { storeId },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return products;
  }

  async updatedStock(productId: string, newQuantity: number): Promise<void> {
    await prisma.storeProductCustom.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });
  }
}
