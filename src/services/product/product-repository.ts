export interface ProductRepository {
  migrateProducts(): Promise<void>;
}
