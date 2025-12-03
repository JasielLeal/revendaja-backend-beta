/*
  Warnings:

  - You are about to drop the column `bannerUrl` on the `stores` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stores" DROP COLUMN "bannerUrl",
ADD COLUMN     "bannerId" TEXT;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
