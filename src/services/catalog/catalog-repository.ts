import { CatalogEntity } from "@/entities/catalog-entity";

export interface CatalogRepository {
  findById(catalogId: number): Promise<null | CatalogEntity>;
  findAll(
    page: number,
    pageSize: number,
    query?: string
  ): Promise<CatalogEntity[]>;
  create(data: {
    name: string;
    brand?: string;
    company?: string;
    category?: string;
    priceSuggested?: number;
    priceNormal?: number;
    barcode: string;
    image?: string;
  }): Promise<void>;
}
