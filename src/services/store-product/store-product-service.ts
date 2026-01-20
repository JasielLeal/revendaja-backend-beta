import { StoreProductEntity } from "@/entities/store-products";
import { StoreProductRepository } from "./store-product-repository";
import { CatalogRepository } from "../catalog/catalog-repository";
import { StoreRepository } from "../store/store-repository";
import { Plan, canAddProduct, getPlanLimits } from "@/config/plans";
import { AppError } from "@/lib/AppError";
import { StoreProductCustomRepository } from "../store-product-custom/store-product-custom-repository";

interface AddCatalogProductDTO {
  catalogId: number;
  userId: string;
  userPlan?: Plan;
  price: number; // Preço que o usuário quer vender
  quantity: number; // Quantidade que o usuário tem em estoque
  validityDate?: Date; // Data de validade do produto
  costPrice?: number; // Preço de custo do produto
}

interface addProductCustomDTO {
  userId: string;
  userPlan?: Plan;
  productData: StoreProduct;
}

interface StoreProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  catalogPrice: number | null;
  catalogId: number | null;
  category: string;
  imgUrl: string;
  storeId: string;
  brand: string;
  company: string;
  barcode: string;
  validityDate: Date;
  costPrice: number;
}

export class StoreProductService {
  constructor(
    private storeProductRepository: StoreProductRepository,
    private catalogRepository: CatalogRepository,
    private storeRepository: StoreRepository,
    private storeProductCustomRepository: StoreProductCustomRepository
  ) { }

  async addCatalogProduct(data: AddCatalogProductDTO): Promise<void> {
    const store = await this.storeRepository.findyStoreByUserId(data.userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Verifica limite de produtos do plano
    if (data.userPlan) {
      await this.checkProductLimit(store.id, data.userPlan);
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
      throw new AppError("Produto já existe na loja", 400);
    }

    if (data.validityDate == null || undefined) {
      data.validityDate = new Date();
    }

    console.log("Catalog Product:", catalogProduct.normalPrice);
    console.log("Final Price:", finalPrice);

    const onSale = finalPrice < catalogProduct.normalPrice;

    console.log("Is On Sale:", onSale);

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
      isOnSale: onSale,
    });

    return;
  }

  async findAllStoreProducts(
    page: number,
    pageSize: number,
    userId: string,
    query?: string,
    category?: string
  ) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Produtos customizados
    const customProducts =
      await this.storeProductCustomRepository.findAllByStoreId(
        store.id,
        page,
        pageSize,
        query
      );

    // Produtos padrão
    const products = await this.storeProductRepository.findAllStoreProducts(
      page,
      pageSize,
      store.id,
      query,
      category
    );

    // Combinar arrays
    const allProductsData = [
      ...(products.data || []), // pega apenas o array de dados
      ...customProducts.products, // produtos customizados
    ];

    const analisedProducts = {
      data: allProductsData,
      pagination: {
        ...products.pagination,
        total:
          (products.pagination?.total || 0) + customProducts.pagination.total,
        totalPages: Math.ceil(
          ((products.pagination?.total || 0) +
            customProducts.pagination.total) /
          (pageSize || 10)
        ),
      },
    };

    return analisedProducts;
  }

  async updateProduct(
    productId: string,
    userId: string,
    updates: {
      price?: number;
      quantity?: number;
      status?: string;
      validity_date?: Date;
      cost_price?: number;
    }
  ): Promise<string[]> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    let product;
    let repository;

    const catalogProduct = await this.storeProductRepository.findById(
      productId
    );

    if (catalogProduct) {
      product = catalogProduct;
      repository = this.storeProductRepository;
    } else {
      const customProduct = await this.storeProductCustomRepository.findById(
        productId
      );

      if (!customProduct) {
        throw new Error("Product not found");
      }

      product = customProduct;
      repository = this.storeProductCustomRepository;
    }

    if (product.storeId !== store.id) {
      throw new Error("Product does not belong to your store");
    }

    const updatedFields: string[] = [];

    if (updates.price !== undefined) {

      let onSale = false;
      if (updates.price < catalogProduct?.catalogPrice) {
        onSale = true;
      }

      await repository.updatePrice(productId, updates.price, onSale);
      updatedFields.push("price");
    }

    if (updates.quantity !== undefined) {
      await repository.updatedStock(productId, updates.quantity);
      updatedFields.push("quantity");
    }

    if (updates.status !== undefined) {
      await repository.updateStatus(productId, updates.status);
      updatedFields.push("status");
    }

    if (updates.validity_date !== undefined) {
      await repository.updateValidityDate(productId, updates.validity_date);
      updatedFields.push("validity_date");
    }

    if (updates.cost_price !== undefined) {
      await repository.updateCostPrice(productId, updates.cost_price);
      updatedFields.push("cost_price");
    }

    return updatedFields;
  }

  async findByBarcode(
    barcode: string,
    userId: string,
    page?: number,
    pageSize?: number
  ): Promise<StoreProductEntity | null> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }
    const normalizedBarcode = barcode.toLowerCase();

    if (normalizedBarcode === store.subdomain) {
      const products = await this.storeProductCustomRepository.findAllByStoreId(
        store.id,
        page,
        pageSize
      );

      // Retorna apenas os campos específicos com paginação
      const formattedProducts = products.products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        brand: product.brand,
        imgUrl: product.imgUrl,
        company: product.company,
        category: product.category,
        status: product.status,
      }));

      return {
        products: formattedProducts,
        total: products.pagination.total,
        page: products.pagination.page,
        pageSize: products.pagination.pageSize,
      } as unknown as StoreProductEntity;
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

  async stockSummary(userId: string) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const productsSummary =
      await this.storeProductRepository.countStoreProducts(store.id);

    const productsLowStock =
      await this.storeProductRepository.countLowStock(store.id, 5);

    const customProductsSummary =
      await this.storeProductCustomRepository.countActiveProducts(store.id);

    const customProductsLowStock =
      await this.storeProductCustomRepository.countLowStock(store.id, 5);

    const summary = productsSummary + customProductsSummary;
    const lowStock = productsLowStock + customProductsLowStock;

    return {
      totalProducts: summary,
      lowStockProducts: lowStock,
    };
  }

  async findOnSaleProducts(subdomain: string): Promise<StoreProductEntity[]> {
    const store = await this.storeRepository.findBySubdomain(subdomain);
    if (!store) {
      throw new Error("Store not found");
    }
    const products = await this.storeProductRepository.findOnSaleProducts(store.id);
    return products;
  }

  // Verifica se o usuário atingiu o limite de produtos do plano
  private async checkProductLimit(storeId: string, plan: Plan): Promise<void> {
    const currentProducts =
      await this.storeProductRepository.countStoreProducts(storeId);

    if (!canAddProduct(plan, currentProducts)) {
      const limits = getPlanLimits(plan);
      throw new AppError(
        `Você atingiu o limite de ${limits.maxProducts} produtos do plano ${plan}. Faça upgrade para adicionar mais produtos.`,
        403
      );
    }
  }
}
