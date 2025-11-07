import { OrderEntity } from "./order-entity";
import { StoreProductEntity } from "./store-products";

export class OrderItemEntity {
  id: string;
  quantity: number;
  price: number;
  name: string;
  imgUrl: string;
  storeProductId: string;
  storeProduct?: StoreProductEntity;
  orderId: string;
  order?: OrderEntity;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<OrderItemEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
