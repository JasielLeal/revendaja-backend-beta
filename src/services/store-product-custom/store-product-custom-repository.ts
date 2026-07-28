import { StoreProductEntity } from "@/entities/store-products";

export type LinkedItemType = "catalog" | "custom";

export interface LinkedProductInput {
  storeProductId: string; // id genérico: pode ser um StoreProduct ou outro StoreProductCustom (kit)
  quantity: number;
}

export interface LinkedProductItem extends LinkedProductInput {
  id: string;
  itemType: LinkedItemType;
  product: StoreProductEntity;
}

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
  create(
    data: StoreProductEntity,
    linkedItems?: LinkedProductInput[]
  ): Promise<StoreProductEntity>;
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

  setLinkedItems(
    customProductId: string,
    items: LinkedProductInput[]
  ): Promise<void>;
  getLinkedItems(customProductId: string): Promise<LinkedProductItem[]>;
}
