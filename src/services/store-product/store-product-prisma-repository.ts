import { StoreProductRepository } from "./store-product-repository";
import { StoreProductEntity } from "@/entities/store-products";
import { prisma } from "@/lib/prisma";

export class StoreProductPrismaRepository implements StoreProductRepository {
  async createStoreProduct(data: StoreProductEntity): Promise<void> {
    await prisma.storeProduct.create({
      data: {
        name: data.name,
        price: data.price, // Preço personalizado pelo usuário
        quantity: data.quantity, // Quantidade personalizada
        catalogPrice: data.catalogPrice, // Preço original do catálogo
        catalogId: data.catalogId,
        category: data.category,
        imgUrl: data.imgUrl, // Mantém a imagem do catálogo
        status: data.status,
        storeId: data.storeId,
        type: data.type,
        brand: data.brand,
        company: data.company,
      },
    });
  }

  async findbyCatalogId(
    catalogId: number,
    storeId: string
  ): Promise<StoreProductEntity | null> {
    const product = await prisma.storeProduct.findFirst({
      where: {
        catalogId,
        storeId,
      },
    });

    return product;
  }

  async findAllStoreProducts(
    page: number,
    pageSize: number,
    storeId: string,
    query?: string
  ) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Busca produtos com filtro opcional pelo nome
    const where: any = {
      storeId,
      // ✅ Removido filtro de status - agora lista TODOS os produtos (ativos e inativos)
    };

    if (query) {
      where.name = {
        contains: query,
        mode: "insensitive", // não diferencia maiúsculas/minúsculas
      };
    }

    // Lista de produtos paginados
    const products = await prisma.storeProduct.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });

    // Total de produtos para paginação
    const total = await prisma.storeProduct.count({ where });

    return {
      data: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string): Promise<StoreProductEntity | null> {
    const product = await prisma.storeProduct.findUnique({
      where: {
        id,
      },
    });

    return product;
  }

  async updatedStock(productId: string, newQuantity: number): Promise<void> {
    await prisma.storeProduct.update({
      where: {
        id: productId,
      },
      data: {
        quantity: newQuantity,
      },
    });

    return;
  }

  async updateStatus(productId: string, status: string): Promise<void> {
    await prisma.storeProduct.update({
      where: {
        id: productId,
      },
      data: {
        status: status,
      },
    });

    return;
  }

  async updatePrice(productId: string, newPrice: number): Promise<void> {
    await prisma.storeProduct.update({
      where: {
        id: productId,
      },
      data: {
        price: newPrice,
      },
    });

    return;
  }
}
