/*
  Warnings:

  - Added the required column `brand` to the `store_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company` to the `store_products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "store_products" ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "company" TEXT NOT NULL;
