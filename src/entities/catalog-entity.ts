import { StoreProductEntity } from "./store-products";

// src/entities/catalog.entity.ts
export class CatalogEntity {
  id: number;
  name: string;
  normalPrice: number;
  suggestedPrice: number;
  category: string;
  barcode?: string;
  imgUrl?: string;
  brand?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
  storeProducts?: StoreProductEntity[];

  constructor(partial: Partial<CatalogEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
