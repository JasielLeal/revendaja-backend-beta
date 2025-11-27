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
        barcode: data.barcode,
        validity_date: data.validityDate,
        cost_price: data.costPrice,
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

  async updateValidityDate(
    productId: string,
    newValidityDate: Date
  ): Promise<void> {
    await prisma.storeProduct.update({
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
    await prisma.storeProduct.update({
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
    const categories = await prisma.storeProduct.findMany({
      where: {
        storeId,
        status: "Active",
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
    return prisma.storeProduct.count({
      where: {
        storeId,
        status: "Active",
      },
    });
  }

  async countProductsByCategory(
    storeId: string
  ): Promise<{ [key: string]: number }> {
    const categoryCounts = await prisma.storeProduct.groupBy({
      by: ["category"],
      where: {
        storeId,
        status: "Active",
      },
      _count: {
        id: true,
      },
    });

    const result: { [key: string]: number } = {};
    categoryCounts.forEach((item) => {
      if (item.category) {
        result[item.category] = item._count.id;
      }
    });

    return result;
  }

  async getActiveProductsWithFilters(
    storeId: string,
    filters: {
      category?: string;
      search?: string;
      page: number;
      limit: number;
      orderBy: "name" | "price" | "createdAt";
      orderDirection: "asc" | "desc";
    }
  ): Promise<{
    products: StoreProductEntity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const where: any = {
      storeId,
      status: "Active",
    };

    // Filtro por categoria
    if (filters.category) {
      where.category = filters.category;
    }

    // Filtro por busca
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Contagem total
    const total = await prisma.storeProduct.count({ where });

    // Busca com paginação e ordenação
    const products = await prisma.storeProduct.findMany({
      where,
      orderBy: {
        [filters.orderBy]: filters.orderDirection,
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    return {
      products: products as StoreProductEntity[],
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getProductWithStore(
    productId: string,
    storeId: string
  ): Promise<StoreProductEntity | null> {
    const product = await prisma.storeProduct.findFirst({
      where: {
        id: productId,
        storeId,
      },
      include: {
        store: true,
      },
    });

    return product as StoreProductEntity | null;
  }

  async findByBarcode(
    barcode: string,
    storeId: string
  ): Promise<StoreProductEntity | null> {
    const product = await prisma.storeProduct.findFirst({
      where: {
        barcode,
        storeId,
      },
    });
    return product as StoreProductEntity | null;
  }
}
