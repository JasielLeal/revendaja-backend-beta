import { StoreEntity } from "./store-entity";

export class StoreSettingsEntity {
  id?: string;
  storeId: string;
  pixKey: string;
  pixName: string;
  createdAt?: Date;
  updatedAt?: Date;
  store?: StoreEntity;

  constructor(partial: Partial<StoreSettingsEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}