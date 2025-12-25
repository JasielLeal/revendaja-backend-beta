import { ProductRepository } from "./product-repository";

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async migrateProducts(): Promise<void> {

    console.log("Starting product migration...");

    await this.productRepository.migrateProducts();
  }
}
