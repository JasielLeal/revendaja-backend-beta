import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { UserRepository } from "../user/user-repository";
import { BannerRepository } from "../banner/banner-repository";
import { StoreSettingsEntity } from "@/entities/store-settings";

export class StoreService {
  constructor(
    private storeRepository: StoreRepository,
    private userRepository: UserRepository,
    private bannerRepository: BannerRepository
  ) { }

  async createStore(data: StoreEntity, userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const store = await this.storeRepository.findByName(data.name);

    if (store) {
      throw new Error("Store name already in use");
    }

    const checkSubdomain = await this.storeRepository.findBySubdomain(
      data.name.toLowerCase().replace(/\s+/g, "")
    );

    if (checkSubdomain) {
      throw new Error("Subdomain already in use");
    }

    const subdomain = data.name.toLowerCase().replace(/\s+/g, "");

    try {
      await fetch(
        `https://api.vercel.com/v10/projects/${process.env.NEXT_PROJECTID}/domains`,
        {
          method: "POST", // Método HTTP correto
          headers: {
            Authorization: "Bearer " + process.env.NEXT_TOKEN,
            "Content-Type": "application/json", // Definir o tipo de conteúdo
          },
          body: JSON.stringify({
            // Converter o body para JSON
            name: `${subdomain}.revendaja.com`,
          }),
        }
      );
    } catch (error) {
      throw new Error("Error creating domain on Vercel:" + error);
    }

    const banner = await this.bannerRepository.findFirst()

    const newStore = await this.storeRepository.createStore({
      address: data.address,
      name: data.name,
      phone: data.phone,
      primaryColor: data.primaryColor || "#fc5800",
      userId: userId,
      subdomain: subdomain,
      bannerId: banner?.id || null,
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

  async verifyDisponibilityTheDomainStore(
    domain: string
  ): Promise<{ available: boolean }> {
    const store = await this.storeRepository.findBySubdomain(domain);

    if (store) {
      throw new Error("Domain already in use");
    }

    return { available: !store };
  }

  async updateStoreInformation(
    userId: string,
    data: Partial<StoreEntity>
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);
    if (!store) {
      throw new Error("Store not found");
    }
    const isBlank = (value?: string | null) =>
      value === undefined || value === null || value.trim() === "";

    const payload: Partial<StoreEntity> = {
      name: isBlank(data.name) ? store.name : data.name,
      address: isBlank(data.address) ? store.address : data.address,
      phone: isBlank(data.phone) ? store.phone : data.phone,
      primaryColor: isBlank(data.primaryColor)
        ? store.primaryColor
        : data.primaryColor,
    };

    const existStore = await this.storeRepository.findBySubdomain(payload.name!.toLowerCase().replace(/\s+/g, ""));

    if (existStore) {
      throw new Error("Subdomain already in use");
    }

    await this.storeRepository.updateStoreInformation(store.id!, payload);

    if (!isBlank(data.name)) {
      const newSubdomain = data.name!.toLowerCase().replace(/\s+/g, "");
      await this.updateSubdomain(userId, newSubdomain);
    }
  }

  async updateSubdomain(
    userId: string,
    subdomain: string
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    await this.storeRepository.updateSubdomain(store.id!, subdomain);
  }

  async getStoreSettings(userId: string): Promise<StoreSettingsEntity | null> {
    const store = await this.storeRepository.findyStoreByUserId(userId);
    if (!store) {
      throw new Error("Store not found");
    }
    const settings = await this.storeRepository.storeSettings(store.id!);
    return settings;
  }

  async createDefaultStoreSettings(storeId: string, pixKey: string, pixName: string): Promise<void> {
    const existingSettings = await this.storeRepository.storeSettings(storeId);
    if (existingSettings) {
      return;
    }

    const defaultSettings = new StoreSettingsEntity({
      storeId: storeId,
      pixKey: pixKey,
      pixName: pixName,
    });

    await this.storeRepository.createStoreSettings(defaultSettings);

    return;
  }

  async updateStoreSettings(
    userId: string,
    data: Partial<StoreSettingsEntity>
  ): Promise<StoreSettingsEntity> {
    const store = await this.storeRepository.findyStoreByUserId(userId);
    if (!store) {
      throw new Error("Store not found");
    }

    const settings = await this.storeRepository.storeSettings(store.id!);
    if (!settings) {
      throw new Error("Store settings not found");
    }

    const isBlank = (value?: string | null) =>
      value === undefined || value === null || value.trim() === "";

    const payload: Partial<StoreSettingsEntity> = {
      pixKey: isBlank(data.pixKey) ? settings.pixKey : data.pixKey,
      pixName: isBlank(data.pixName) ? settings.pixName : data.pixName,
    };

    return this.storeRepository.updateStoreSettings(store.id!, payload);
  }

  async updateAppareance(userId: string, primaryColor?: string, logo?: string): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const payload: Partial<StoreEntity> = {
      primaryColor: primaryColor || store.primaryColor,
      logo: logo || store.logo,
    };
    await this.storeRepository.updateStoreInformation(store.id!, payload);
  }
}