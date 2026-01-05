import { StoreProductEntity } from "@/entities/store-products";

export interface StoreProductCustomRepository {
  findById(id: string): Promise<StoreProductEntity | null>;
  updatedStock(productId: string, newQuantity: number): Promise<void>;
  findAllByStoreId(
    storeId: string,
    page?: number,
    pageSize?: number,
    query?: string,
    category?: string,
    status?: string
  ): Promise<{
    products: StoreProductEntity[];
    pagination: { page: number; pageSize: number; total: number, totalPages: number };
    usedFuzzy: boolean;
  }>;
  create(data: StoreProductEntity): Promise<StoreProductEntity>;
  updatePrice(productId: string, newPrice: number): Promise<void>;
  updateStatus(productId: string, status: string): Promise<void>;
  updateValidityDate(productId: string, newValidityDate: Date): Promise<void>;
  updateCostPrice(
    productId: string,
    newCostPrice: number
  ): Promise<void>

  getUniqueCategories(storeId: string): Promise<string[]>
  countActiveProducts(storeId: string): Promise<number>
  countLowStock(storeId: string, limit: number): Promise<number>;
}
