import { StoreProductEntity } from "@/entities/store-products";
import { StoreProductRepository } from "./store-product-repository";
import { CatalogRepository } from "../catalog/catalog-repository";
import { StoreRepository } from "../store/store-repository";

interface AddCatalogProductDTO {
  catalogId: number;
  userId: string;
  price: number; // Preço que o usuário quer vender
  quantity: number; // Quantidade que o usuário tem em estoque
}

export class StoreProductService {
  constructor(
    private storeProductRepository: StoreProductRepository,
    private catalogRepository: CatalogRepository,
    private storeRepository: StoreRepository
  ) {}

  async addCatalogProduct(data: AddCatalogProductDTO): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(data.userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const catalogProduct = await this.catalogRepository.findById(
      data.catalogId
    );

    if (!catalogProduct) {
      throw new Error("Product not found");
    }

    const finalPrice =
      data.price != null ? data.price : catalogProduct.suggestedPrice;

    const storeProductExist = await this.storeProductRepository.findbyCatalogId(
      data.catalogId
    );

    if (storeProductExist) {
      throw new Error("Produto já existe na loja");
    }

    await this.storeProductRepository.createStoreProduct({
      name: catalogProduct.name,
      price: finalPrice,
      quantity: data.quantity,
      catalogPrice: catalogProduct.normalPrice,
      catalogId: data.catalogId,
      category: catalogProduct.category,
      imgUrl: catalogProduct.imgUrl,
      storeId: store.id,
      brand: catalogProduct.brand,
      company: catalogProduct.company,
    });

    return;
  }

  async findAllStoreProducts(
    page: number,
    pageSize: number,
    userId: string,
    query?: string
  ) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const products = await this.storeProductRepository.findAllStoreProducts(
      page,
      pageSize,
      store.id,
      query
    );

    return products;
  }
}
