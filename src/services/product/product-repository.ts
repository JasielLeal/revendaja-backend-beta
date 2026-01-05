export interface ProductRepository {
  migrateProducts(): Promise<void>;
  migrateProductsForStore(storeId: string): Promise<void>;
}
