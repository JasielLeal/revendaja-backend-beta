-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "pixName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_storeId_key" ON "store_settings"("storeId");

-- AddForeignKey
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
