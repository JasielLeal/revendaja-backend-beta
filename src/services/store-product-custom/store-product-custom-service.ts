import { StoreProductEntity } from "@/entities/store-products";
import {
  LinkedItemType,
  LinkedProductInput,
  LinkedProductItem,
  StoreProductCustomRepository,
} from "./store-product-custom-repository";
import { StoreRepository } from "../store/store-repository";
import { StoreProductRepository } from "../store-product/store-product-repository";
import { AppError } from "@/lib/AppError";

const MAX_KIT_DEPTH = 20;

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
      const types = await this.validateLinkedProducts(
        linkedProducts,
        store.id
      );

      const customCandidateIds = linkedProducts
        .filter((_, idx) => types[idx] === "custom")
        .map((link) => link.storeProductId);

      if (customCandidateIds.length > 0) {
        await this.assertNoCycle(customProductId, customCandidateIds);
      }
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

  // Resolve cada link para "catalog" (StoreProduct) ou "custom" (outro kit),
  // validando existência e propriedade da loja em ambos os casos. Retorna os
  // tipos resolvidos, na mesma ordem de `linkedProducts`, para uso posterior
  // (ex: detecção de ciclo, que só se aplica aos links do tipo "custom").
  private async validateLinkedProducts(
    linkedProducts: LinkedProductInput[],
    storeId: string
  ): Promise<LinkedItemType[]> {
    const types: LinkedItemType[] = [];

    for (const link of linkedProducts) {
      if (link.quantity < 1) {
        throw new AppError("Linked product quantity must be at least 1", 400);
      }

      const catalogProduct: StoreProductEntity | null =
        await this.storeProductRepository.findById(link.storeProductId);

      if (catalogProduct) {
        if (catalogProduct.storeId !== storeId) {
          throw new AppError(
            `Linked product not found: ${link.storeProductId}`,
            400
          );
        }
        types.push("catalog");
        continue;
      }

      const customProduct =
        await this.storeProductCustomRepository.findById(
          link.storeProductId
        );

      if (!customProduct || customProduct.storeId !== storeId) {
        throw new AppError(
          `Linked product not found: ${link.storeProductId}`,
          400
        );
      }

      types.push("custom");
    }

    return types;
  }

  // BFS a partir dos kits candidatos (tipo "custom") do payload, seguindo somente
  // arestas do tipo "custom", para detectar se algum caminho leva de volta a `kitId`
  // (ciclo direto ou indireto). `visited` também protege contra dados já corrompidos
  // (ciclo residual) e `MAX_KIT_DEPTH` evita percorrer indefinidamente em caso de bug.
  private async assertNoCycle(
    kitId: string,
    customCandidateIds: string[]
  ): Promise<void> {
    const visited = new Set<string>();
    let frontier = customCandidateIds;
    let depth = 0;

    while (frontier.length > 0) {
      if (frontier.includes(kitId)) {
        throw new AppError(
          "Circular kit reference detected: a kit cannot contain itself, directly or indirectly",
          400
        );
      }

      depth += 1;
      if (depth > MAX_KIT_DEPTH) {
        throw new AppError(
          `Kit nesting is too deep (max ${MAX_KIT_DEPTH} levels)`,
          400
        );
      }

      const nextFrontier: string[] = [];

      for (const currentId of frontier) {
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const children = await this.storeProductCustomRepository.getLinkedItems(
          currentId
        );

        for (const child of children) {
          if (child.itemType === "custom") {
            nextFrontier.push(child.storeProductId);
          }
        }
      }

      frontier = nextFrontier;
    }
  }
}
