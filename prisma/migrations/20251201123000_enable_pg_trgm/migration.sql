-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Useful GIN indexes for similarity and ILIKE searches
CREATE INDEX IF NOT EXISTS store_products_name_trgm_idx
  ON "store_products" USING gin (lower("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS store_products_brand_trgm_idx
  ON "store_products" USING gin (lower("brand") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS store_products_company_trgm_idx
  ON "store_products" USING gin (lower("company") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS store_products_category_trgm_idx
  ON "store_products" USING gin (lower("category") gin_trgm_ops);
