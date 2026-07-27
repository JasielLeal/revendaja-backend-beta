-- Enable trigram similarity search, required by the fuzzy fallback used in
-- store product / store product custom search (similarity(), word_similarity()).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Speed up the fuzzy fallback (avoids a sequential scan per search).
CREATE INDEX IF NOT EXISTS store_products_name_trgm_idx ON "store_products" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS store_product_customs_name_trgm_idx ON "store_product_customs" USING gin ("name" gin_trgm_ops);
