import { StoreProductEntity } from "@/entities/store-products";
import { StoreProductRepository } from "./store-product-repository";
import { CatalogRepository } from "../catalog/catalog-repository";
import { StoreRepository } from "../store/store-repository";
import { da } from "zod/locales";

interface AddCatalogProductDTO {
  catalogId: number;
  userId: string;
  price: number; // Preço que o usuário quer vender
  quantity: number; // Quantidade que o usuário tem em estoque
  validityDate?: Date; // Data de validade do produto
  costPrice?: number; // Preço de custo do produto
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
      data.catalogId,
      store.id
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
      barcode: catalogProduct.barcode,
      validityDate: data.validityDate,
      costPrice: data.costPrice,
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

  async updateProduct(
    productId: string,
    userId: string,
    updates: {
      price?: number;
      quantity?: number;
      status?: string;
      validityDate?: Date;
      costPrice?: number;
    }
  ): Promise<string[]> {
    // Verificar se a loja pertence ao usuário
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Verificar se o produto existe e pertence à loja do usuário
    const product = await this.storeProductRepository.findById(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.storeId !== store.id) {
      throw new Error("Product does not belong to your store");
    }

    // Aplicar atualizações parciais
    const updatedFields: string[] = [];

    if (updates.price !== undefined) {
      await this.storeProductRepository.updatePrice(productId, updates.price);
      updatedFields.push("price");
    }

    if (updates.quantity !== undefined) {
      await this.storeProductRepository.updatedStock(
        productId,
        updates.quantity
      );
      updatedFields.push("quantity");
    }

    if (updates.status !== undefined) {
      await this.storeProductRepository.updateStatus(productId, updates.status);
      updatedFields.push("status");
    }

    if (updates.validityDate !== undefined) {
      await this.storeProductRepository.updateValidityDate(
        productId,
        new Date(updates.validityDate)
      );
      updatedFields.push("validityDate");
    }

    if (updates.costPrice !== undefined) {
      await this.storeProductRepository.updateCostPrice(
        productId,
        updates.costPrice
      );
      updatedFields.push("costPrice");
    }

    return updatedFields;
  }

  async findByBarcode(
    barcode: string,
    userId: string
  ): Promise<StoreProductEntity | null> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const product = await this.storeProductRepository.findByBarcode(
      barcode,
      store.id
    );

    if (!product) {
      return null;
    }

    return product;
  }
}
