-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "mobile_url" TEXT NOT NULL,
    "desktop_url" TEXT NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);
