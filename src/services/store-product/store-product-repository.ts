import { StoreProductEntity } from "@/entities/store-products";

interface ProductFilters {
  category?: string;
  search?: string;
  page: number;
  limit: number;
  orderBy: "name" | "price" | "createdAt";
  orderDirection: "asc" | "desc";
}

export interface StoreProductRepository {
  createStoreProduct(data: StoreProductEntity): Promise<void>;
  findbyCatalogId(
    catalogId: number,
    storeId: string
  ): Promise<StoreProductEntity | null>;
  findById(id: string): Promise<StoreProductEntity | null>;
  findAllStoreProducts(
    page: number,
    pageSize: number,
    storeId: string,
    query: string
  );
  updatedStock(productId: string, newQuantity: number): Promise<void>;
  updateStatus(productId: string, status: string): Promise<void>;
  updatePrice(productId: string, newPrice: number): Promise<void>;

  // Métodos para store-web
  getUniqueCategories(storeId: string): Promise<string[]>;
  countActiveProducts(storeId: string): Promise<number>;
  countProductsByCategory(storeId: string): Promise<{ [key: string]: number }>;
  getActiveProductsWithFilters(
    storeId: string,
    filters: ProductFilters
  ): Promise<{
    products: StoreProductEntity[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }>;
  getProductWithStore(
    productId: string,
    storeId: string
  ): Promise<StoreProductEntity | null>;
  findByBarcode(
    barcode: string,
    storeId: string
  ): Promise<StoreProductEntity | null>;
}
