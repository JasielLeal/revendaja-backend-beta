import { StoreEntity } from "@/entities/store-entity";

export interface StoreRepository {
  createStore(data: StoreEntity): Promise<void>;
  findByName(name: string): Promise<StoreEntity | null>;
  findyStoreByUserId(userId: string): Promise<StoreEntity | null>;
}
