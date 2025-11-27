/*
  Warnings:

  - You are about to drop the column `costPrice` on the `store_products` table. All the data in the column will be lost.
  - You are about to drop the column `validityDate` on the `store_products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "store_products" DROP COLUMN "costPrice",
DROP COLUMN "validityDate",
ADD COLUMN     "cost_price" DOUBLE PRECISION,
ADD COLUMN     "validity_date" TIMESTAMP(3);
