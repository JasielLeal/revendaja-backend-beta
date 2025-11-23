import { CatalogEntity } from "./catalog-entity";
import { StoreEntity } from "./store-entity";

export class StoreProductEntity {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  brand: string;
  company: string;
  catalogPrice?: number;
  catalogId?: number;
  barcode?: string;
  category?: string;
  imgUrl?: string;
  status?: string;
  storeId: string;
  store?: StoreEntity;
  catalog?: CatalogEntity;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<StoreProductEntity>) {
    Object.assign(this, partial);
    this.quantity = this.quantity || 0;
    this.status = this.status;
    this.type = this.type;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
