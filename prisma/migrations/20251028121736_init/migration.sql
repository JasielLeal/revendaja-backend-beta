/*
  Warnings:

  - The `status` column on the `store_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `store_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "store_products" DROP COLUMN "status",
ADD COLUMN     "status" TEXT DEFAULT 'Active',
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'Catalog';

-- DropEnum
DROP TYPE "public"."ProductStatus";

-- DropEnum
DROP TYPE "public"."ProductType";
