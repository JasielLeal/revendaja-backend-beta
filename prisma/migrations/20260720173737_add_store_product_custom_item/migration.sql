-- CreateTable
CREATE TABLE "store_product_custom_items" (
    "id" TEXT NOT NULL,
    "storeProductCustomId" TEXT NOT NULL,
    "storeProductId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_custom_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_product_custom_items_storeProductCustomId_storeProduc_key" ON "store_product_custom_items"("storeProductCustomId", "storeProductId");

-- AddForeignKey
ALTER TABLE "store_product_custom_items" ADD CONSTRAINT "store_product_custom_items_storeProductCustomId_fkey" FOREIGN KEY ("storeProductCustomId") REFERENCES "store_product_customs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_custom_items" ADD CONSTRAINT "store_product_custom_items_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
