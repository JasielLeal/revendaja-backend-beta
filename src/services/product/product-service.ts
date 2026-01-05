import { ProductRepository } from "./product-repository";

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async migrateProducts(): Promise<void> {

    console.log("Starting product migration...");

    await this.productRepository.migrateProducts();
  }

  async migrateProductsForStore(storeId: string): Promise<void> {

    console.log(`Starting product migration for store ${storeId}...`);
    await this.productRepository.migrateProductsForStore(storeId);
  }
}
