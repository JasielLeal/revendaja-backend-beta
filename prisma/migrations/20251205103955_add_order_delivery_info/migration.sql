-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryNeighborhood" TEXT,
ADD COLUMN     "deliveryNumber" TEXT,
ADD COLUMN     "deliveryStreet" TEXT,
ADD COLUMN     "isDelivery" BOOLEAN NOT NULL DEFAULT false;
