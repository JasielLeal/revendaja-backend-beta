-- AlterTable: storeProductId passa a ser opcional; adiciona colunas para permitir
-- que um StoreProductCustomItem aponte para outro StoreProductCustom (kit dentro de kit)
ALTER TABLE "store_product_custom_items"
  ALTER COLUMN "storeProductId" DROP NOT NULL,
  ADD COLUMN "linkedCustomProductId" TEXT,
  ADD COLUMN "linkedItemType" TEXT NOT NULL DEFAULT 'catalog';

-- Backfill defensivo: linhas existentes são todas 'catalog' (único tipo possível antes desta migration)
UPDATE "store_product_custom_items" SET "linkedItemType" = 'catalog' WHERE "storeProductId" IS NOT NULL;

-- Recria o unique index antigo (baseado em storeProductId NOT NULL) como dois índices,
-- um para cada tipo de vínculo (catalog / custom). NULL é distinto em índice único no Postgres,
-- então cada linha (que preenche só uma das duas colunas) não colide com a outra.
DROP INDEX IF EXISTS "store_product_custom_items_storeProductCustomId_storeProduc_key";

CREATE UNIQUE INDEX "store_product_custom_items_kit_catalog_key"
  ON "store_product_custom_items"("storeProductCustomId", "storeProductId");

CREATE UNIQUE INDEX "store_product_custom_items_kit_custom_key"
  ON "store_product_custom_items"("storeProductCustomId", "linkedCustomProductId");

-- AddForeignKey: nova FK opcional para store_product_customs (mesmo onDelete: Cascade já usado
-- para a FK de catálogo, para manter o comportamento consistente)
ALTER TABLE "store_product_custom_items"
  ADD CONSTRAINT "store_product_custom_items_linkedCustomProductId_fkey"
  FOREIGN KEY ("linkedCustomProductId") REFERENCES "store_product_customs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK: garante que exatamente uma das duas FKs está preenchida e coerente com linkedItemType
ALTER TABLE "store_product_custom_items"
  ADD CONSTRAINT "store_product_custom_items_link_target_check"
  CHECK (
    ("linkedItemType" = 'catalog' AND "storeProductId" IS NOT NULL AND "linkedCustomProductId" IS NULL)
    OR
    ("linkedItemType" = 'custom' AND "linkedCustomProductId" IS NOT NULL AND "storeProductId" IS NULL)
  );
