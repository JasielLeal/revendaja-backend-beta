-- AlterTable
ALTER TABLE "store_products" ADD COLUMN     "costPrice" DOUBLE PRECISION,
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "type" SET DEFAULT 'catalog';
