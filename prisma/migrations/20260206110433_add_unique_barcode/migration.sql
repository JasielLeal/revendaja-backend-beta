/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `catalog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "catalog_barcode_key" ON "catalog"("barcode");
