import { StoreProductEntity } from "@/entities/store-products";

export interface StoreProductCustomRepository {
  findById(id: string): Promise<StoreProductEntity | null>;
  updatedStock(productId: string, newQuantity: number): Promise<void>;
  findAllByStoreId(
    storeId: string,
    page?: number,
    pageSize?: number,
    query?: string
  ): Promise<{
    products: StoreProductEntity[];
    pagination: { page: number; pageSize: number; total: number };
  }>;
  create(data: StoreProductEntity): Promise<StoreProductEntity>;
}
