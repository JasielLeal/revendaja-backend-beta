import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { UserRepository } from "../user/user-repository";
import { BannerRepository } from "../banner/banner-repository";

export class StoreService {
  constructor(
    private storeRepository: StoreRepository,
    private userRepository: UserRepository,
    private bannerRepository: BannerRepository
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

    if (store && store.subdomain === domain) {
      throw new Error("Domain already in use");
    }

    return { available: !store };
  }
}
