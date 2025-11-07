import { CatalogEntity } from "@/entities/catalog-entity";

export interface CatalogRepository {
  findById(catalogId: number): Promise<null | CatalogEntity>;
  findAll(page: number, pageSize: number, query?: string): Promise<CatalogEntity[]>;
}
