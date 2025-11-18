import { StoreProductEntity } from "./store-products";
import { UserEntity } from "./user-entity";

// src/entities/store.entity.ts
export class StoreEntity {
  id?: string;
  name: string;
  subdomain?: string;
  address: string;
  phone: string;
  primaryColor?: string;
  bannerUrl?: string;
  userId: string;
  user?: UserEntity;
  createdAt?: Date;
  updatedAt?: Date;
  storeProducts?: StoreProductEntity[];

  constructor(partial: Partial<StoreEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
