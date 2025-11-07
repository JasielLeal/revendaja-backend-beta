import { ProductRepository } from "./product-repository";

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async migrateProducts(): Promise<void> {
    await this.productRepository.migrateProducts();
  }
}
