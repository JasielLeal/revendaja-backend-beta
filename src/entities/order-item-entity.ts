import { OrderEntity } from "./order-entity";
import { StoreProductEntity } from "./store-products";

export class OrderItemEntity {
  id: string;
  quantity: number;
  price: number;
  name: string;
  imgUrl: string;
  productType: "catalog" | "custom"; // Tipo de produto
  storeProductId?: string; // Para produtos do catálogo
  storeProduct?: StoreProductEntity;
  storeProductCustomId?: string; // Para produtos customizados
  orderId: string;
  order?: OrderEntity;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.productType = this.productType || "catalog";
  }
}
