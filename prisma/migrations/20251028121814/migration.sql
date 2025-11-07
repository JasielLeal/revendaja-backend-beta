/*
  Warnings:

  - You are about to drop the column `description` on the `store_products` table. All the data in the column will be lost.
  - You are about to drop the column `trackQuantity` on the `store_products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "store_products" DROP COLUMN "description",
DROP COLUMN "trackQuantity";
