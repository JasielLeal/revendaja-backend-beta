import { StoreEntity } from "@/entities/store-entity";
import { StoreSettingsEntity } from "@/entities/store-settings";

export interface StoreRepository {
  createStore(data: StoreEntity): Promise<StoreEntity>;
  findByName(name: string): Promise<StoreEntity | null>;
  findyStoreByUserId(userId: string): Promise<StoreEntity | null>;
  findBySubdomain(subdomain: string): Promise<StoreEntity | null>;
  updatePrimaryColor(storeId: string, primaryColor: string): Promise<void>;
  updateStoreInformation(
    storeId: string,
    data: Partial<StoreEntity>
  ): Promise<void>;

  updateSubdomain(storeId: string, subdomain: string): Promise<void>;
  storeSettings(storeId: string): Promise<StoreSettingsEntity | null>;
  createStoreSettings(data: StoreSettingsEntity): Promise<StoreSettingsEntity>;
  updateStoreSettings(
    storeId: string,
    data: Partial<StoreSettingsEntity>
  ): Promise<StoreSettingsEntity>;
}
