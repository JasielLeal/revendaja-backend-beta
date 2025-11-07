import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { UserRepository } from "../user/user-repository";

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

    const subdomain = data.name.toLowerCase().replace(/\s+/g, "-");

    await this.storeRepository.createStore({
      address: data.address,
      name: data.name,
      phone: data.phone,
      userId: userId,
      subdomain: subdomain,
    });
  }
}
