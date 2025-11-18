import { StoreRepository } from "../store/store-repository";
import { StoreProductRepository } from "../store-product/store-product-repository";

interface ProductFilters {
  category?: string;
  search?: string;
  page: number;
  limit: number;
  orderBy: "name" | "price" | "createdAt";
  orderDirection: "asc" | "desc";
}

export class StoreWebService {
  constructor(
    private storeRepository: StoreRepository,
    private storeProductRepository: StoreProductRepository
  ) {}

  async getStoreInfo(subdomain: string) {
    // Busca a loja pelo subdomínio
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    // Busca categorias dos produtos ativos
    const categories = await this.storeProductRepository.getUniqueCategories(
      store.id
    );

    // Conta total de produtos
    const totalProducts = await this.storeProductRepository.countActiveProducts(
      store.id
    );

    // Conta produtos por categoria
    const productsByCategory =
      await this.storeProductRepository.countProductsByCategory(store.id);

    return {
      id: store.id,
      name: store.name,
      subdomain: store.subdomain,
      address: store.address,
      phone: store.phone,
      primaryColor: store.primaryColor || "#fc5800",
      bannerUrl: store.bannerUrl,
      createdAt: store.createdAt,
      categories,
      totalProducts,
      productsByCategory: {
        Masculino: productsByCategory.Masculino || 0,
        Feminino: productsByCategory.Feminino || 0,
      },
    };
  }

  async getStoreProducts(subdomain: string, filters: ProductFilters) {
    // Busca a loja pelo subdomínio
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    // Busca produtos com filtros e paginação
    const productsData =
      await this.storeProductRepository.getActiveProductsWithFilters(
        store.id,
        filters
      );

    // Busca categorias disponíveis
    const categories = await this.storeProductRepository.getUniqueCategories(
      store.id
    );

    return {
      products: productsData.products,
      pagination: productsData.pagination,
      categories,
    };
  }

  async getStoreProductsList(
    subdomain: string,
    page: number,
    pageSize: number,
    search?: string,
    category?: string,
    status?: string
  ) {
    // Busca a loja pelo subdomínio
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    // Usa o método existente do repositório com adaptação
    const result = await this.storeProductRepository.findAllStoreProducts(
      page,
      pageSize,
      store.id,
      search || ""
    );

    // Filtrar por categoria e status se necessário
    let filteredData = result.data;

    if (category) {
      filteredData = filteredData.filter(
        (product) => product.category === category
      );
    }

    if (status) {
      filteredData = filteredData.filter(
        (product) => product.status === status
      );
    }

    return {
      data: filteredData,
      pagination: {
        page,
        pageSize,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / pageSize),
      },
    };
  }

  async getProductDetails(subdomain: string, productId: string) {
    // Busca a loja pelo subdomínio
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    // Busca o produto com detalhes da loja
    const product = await this.storeProductRepository.getProductWithStore(
      productId,
      store.id
    );

    if (!product) {
      throw new Error("Product not found");
    }

    // Verifica se o produto está ativo
    if (product.status !== "Active") {
      throw new Error("Product not found");
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      imgUrl: product.imgUrl,
      brand: product.brand,
      company: product.company,
      type: product.type,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      catalogPrice: product.catalogPrice,
      store: {
        id: store.id,
        name: store.name,
        subdomain: store.subdomain,
        address: store.address,
        phone: store.phone,
        primaryColor: store.primaryColor || "#fc5800",
        bannerUrl: store.bannerUrl,
      },
    };
  }

  async getStoreCategories(subdomain: string) {
    // Busca a loja pelo subdomínio
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    // Busca categorias únicas
    const categories = await this.storeProductRepository.getUniqueCategories(
      store.id
    );

    // Conta produtos por categoria
    const categoriesCount =
      await this.storeProductRepository.countProductsByCategory(store.id);

    return {
      categories,
      categoriesCount: {
        Masculino: categoriesCount.Masculino || 0,
        Feminino: categoriesCount.Feminino || 0,
      },
    };
  }
}
