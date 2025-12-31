import { StoreProductEntity } from "@/entities/store-products";
import { StoreProductCustomRepository } from "./store-product-custom-repository";
import { StoreRepository } from "../store/store-repository";

export class StoreProductCustomService {
  constructor(
    private storeProductCustomRepository: StoreProductCustomRepository,
    private storeRepository: StoreRepository
  ) {}

  async createCustomProduct(
    data: {
        name: string;
        price: number;
        quantity: number;
        imgUrl?: string;
        category?: string;
        costPrice?: number;
    },
    userId: string,
    userPlan?: string
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    await this.storeProductCustomRepository.create({
      barcode: store.subdomain,
      brand: store.name,
      category: data.category || "Kits",
      company: store.name,
      imgUrl: data.imgUrl,
      name: data.name,
      price: data.price,
      quantity: data.quantity,
      costPrice: data.costPrice,
      storeId: store.id,
    });

    return;
  }
}
