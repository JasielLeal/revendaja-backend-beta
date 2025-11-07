import { StoreProductEntity } from "@/entities/store-products";

export interface StoreProductRepository {
  createStoreProduct(data: StoreProductEntity): Promise<void>;
  findbyCatalogId(catalogId: number): Promise<StoreProductEntity | null>;
  findById(id: string): Promise<StoreProductEntity | null>;
  findAllStoreProducts(
    page: number,
    pageSize: number,
    storeId: string,
    query: string
  );
  updatedStock(productId: string, newQuantity: number): Promise<void>;
}
