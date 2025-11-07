import { OrderItemEntity } from "./order-item-entity";
import { StoreEntity } from "./store-entity";

export class OrderEntity {
  id?: string;
  orderNumber: string;
  status?: string;
  total: number;
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  storeId: string;
  store?: StoreEntity;
  items: OrderItemEntity[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<OrderEntity>) {
    Object.assign(this, partial);
    this.status = this.status || "Approved";
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.items = this.items || [];
  }
}
