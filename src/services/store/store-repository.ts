import { StoreEntity } from "@/entities/store-entity";

export interface StoreRepository {
  createStore(data: StoreEntity): Promise<void>;
  findByName(name: string): Promise<StoreEntity | null>;
  findyStoreByUserId(userId: string): Promise<StoreEntity | null>;
  findBySubdomain(subdomain: string): Promise<StoreEntity | null>;
  updatePrimaryColor(storeId: string, primaryColor: string): Promise<void>;
  updateBanner(storeId: string, bannerUrl: string): Promise<void>;
}
