import { StorePrismaRepository } from "../store/store-prisma-repository";
import { CatalogPrismaRepository } from "./catalog-prisma-repository";

export class CatalogService {
  constructor(
    private catalogRepository: CatalogPrismaRepository,
    private storeRepository: StorePrismaRepository
  ) {}

  async getAll(userId: string, page: number, pageSize: number, query?: string) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const products = await this.catalogRepository.findAll(
      page,
      pageSize,
      query
    );
    const totalProducts = await this.catalogRepository.count(query);
    const totalPages = Math.ceil(totalProducts / pageSize);

    return {
      products,
      pagination: {
        currentPage: page,
        pageSize,
        totalProducts,
        totalPages,
      },
    };
  }

  async create(data: {
    name: string;
    brand?: string;
    company?: string;
    category?: string;
    priceSuggested?: number;
    priceNormal?: number;
    barcode: string;
    image?: string;
  }): Promise<void> {
   
    await this.catalogRepository.create(data);

  }
}
