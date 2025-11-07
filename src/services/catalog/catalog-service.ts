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

    const products = await this.catalogRepository.findAll(page, pageSize, query);

    return products;
  }
}
