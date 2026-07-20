import { StoreProductEntity } from "@/entities/store-products";
import {
  LinkedProductInput,
  LinkedProductItem,
  StoreProductCustomRepository,
} from "./store-product-custom-repository";
import { StoreRepository } from "../store/store-repository";
import { StoreProductRepository } from "../store-product/store-product-repository";

export class StoreProductCustomService {
  constructor(
    private storeProductCustomRepository: StoreProductCustomRepository,
    private storeRepository: StoreRepository,
    private storeProductRepository: StoreProductRepository
  ) {}

  async createCustomProduct(
    data: {
        name: string;
        price: number;
        quantity: number;
        imgUrl?: string;
        category?: string;
        costPrice?: number;
        linkedProducts?: LinkedProductInput[];
    },
    userId: string,
    userPlan?: string
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    if (data.linkedProducts && data.linkedProducts.length > 0) {
      await this.validateLinkedProducts(data.linkedProducts, store.id);
    }

    await this.storeProductCustomRepository.create(
      {
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
      },
      data.linkedProducts
    );

    return;
  }

  async updateLinkedProducts(
    customProductId: string,
    userId: string,
    linkedProducts: LinkedProductInput[]
  ): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const customProduct = await this.storeProductCustomRepository.findById(
      customProductId
    );

    if (!customProduct || customProduct.storeId !== store.id) {
      throw new Error("Custom product not found");
    }

    if (linkedProducts.length > 0) {
      await this.validateLinkedProducts(linkedProducts, store.id);
    }

    await this.storeProductCustomRepository.setLinkedItems(
      customProductId,
      linkedProducts
    );

    return;
  }

  async getLinkedProducts(
    customProductId: string,
    userId: string
  ): Promise<LinkedProductItem[]> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const customProduct = await this.storeProductCustomRepository.findById(
      customProductId
    );

    if (!customProduct || customProduct.storeId !== store.id) {
      throw new Error("Custom product not found");
    }

    return this.storeProductCustomRepository.getLinkedItems(customProductId);
  }

  private async validateLinkedProducts(
    linkedProducts: LinkedProductInput[],
    storeId: string
  ): Promise<void> {
    for (const link of linkedProducts) {
      if (link.quantity < 1) {
        throw new Error("Linked product quantity must be at least 1");
      }

      const product: StoreProductEntity | null =
        await this.storeProductRepository.findById(link.storeProductId);

      if (!product || product.storeId !== storeId) {
        throw new Error(`Linked product not found: ${link.storeProductId}`);
      }
    }
  }
}
