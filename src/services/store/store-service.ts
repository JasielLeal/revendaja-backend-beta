import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { UserRepository } from "../user/user-repository";
import { BannerService } from "../banner/banner-service";

export class StoreService {
  constructor(
    private storeRepository: StoreRepository,
    private userRepository: UserRepository
  ) {}

  async createStore(data: StoreEntity, userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const store = await this.storeRepository.findByName(data.name);

    if (store) {
      throw new Error("Store name already in use");
    }

    const subdomain = data.name.toLowerCase().replace(/\s+/g, "");

    await this.storeRepository.createStore({
      address: data.address,
      name: data.name,
      phone: data.phone,
      primaryColor: data.primaryColor || "#fc5800",
      userId: userId,
      subdomain: subdomain,
    });
  }

  async findStoreByUserId(userId: string): Promise<StoreEntity | null> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    return store;
  }

  async updatePrimaryColor(
    userId: string,
    primaryColor: string
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    await this.storeRepository.updatePrimaryColor(store.id!, primaryColor);
  }

  async updateBanner(userId: string, bannerId: string): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Validar se o banner existe
    if (!BannerService.validateBannerId(bannerId)) {
      throw new Error("Invalid banner ID");
    }

    const banner = BannerService.getBannerById(bannerId);
    await this.storeRepository.updateBanner(store.id!, banner!.url);
  }
}
