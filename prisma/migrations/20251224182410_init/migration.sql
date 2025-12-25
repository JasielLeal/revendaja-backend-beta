-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tokenAccess" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "stripeCustomerId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalPrice" DOUBLE PRECISION NOT NULL,
    "suggestedPrice" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "barcode" TEXT,
    "imgUrl" TEXT,
    "brand" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#fc5800',
    "bannerId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "catalogPrice" DOUBLE PRECISION,
    "catalogId" INTEGER,
    "barcode" TEXT NOT NULL,
    "category" TEXT,
    "imgUrl" TEXT,
    "cost_price" DOUBLE PRECISION,
    "validity_date" TIMESTAMP(3),
    "status" TEXT DEFAULT 'active',
    "brand" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'catalog',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_customs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "barcode" TEXT NOT NULL,
    "category" TEXT,
    "imgUrl" TEXT,
    "cost_price" DOUBLE PRECISION,
    "validity_date" TIMESTAMP(3),
    "status" TEXT DEFAULT 'active',
    "brand" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_customs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Approved',
    "total" DOUBLE PRECISION NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'Pix',
    "isDelivery" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStreet" TEXT,
    "deliveryNumber" TEXT,
    "deliveryNeighborhood" TEXT,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "imgUrl" TEXT NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'catalog',
    "storeProductId" TEXT,
    "storeProductCustomId" TEXT,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stores_name_key" ON "stores"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stores_subdomain_key" ON "stores"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "store_products_storeId_catalogId_key" ON "store_products"("storeId", "catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_storeId_key" ON "push_tokens"("token", "storeId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "banners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_products" ADD CONSTRAINT "store_products_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_customs" ADD CONSTRAINT "store_product_customs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_storeProductId_fkey" FOREIGN KEY ("storeProductId") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_storeProductCustomId_fkey" FOREIGN KEY ("storeProductCustomId") REFERENCES "store_product_customs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
