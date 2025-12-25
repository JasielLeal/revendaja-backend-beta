import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { prisma } from "@/lib/prisma";

export class StorePrismaRepository implements StoreRepository {
  async createStore(data: StoreEntity): Promise<StoreEntity> {
    const store = await prisma.store.create({
      data: {
        address: data.address,
        name: data.name,
        phone: data.phone,
        primaryColor: data.primaryColor,
        bannerId: data.bannerId,
        userId: data.userId,
        subdomain: data.subdomain,
      },
    });

    return store
  }

  async findByName(name: string): Promise<StoreEntity | null> {
    const store = await prisma.store.findUnique({
      where: { name },
    });

    return store;
  }

  async findyStoreByUserId(userId: string): Promise<StoreEntity | null> {
    const store = await prisma.store.findFirst({
      where: {
        userId,
      },
    });
    return store;
  }

  async findBySubdomain(subdomain: string): Promise<StoreEntity | null> {
    const store = await prisma.store.findUnique({
      where: { subdomain },
    });

    return store;
  }

  async updatePrimaryColor(
    storeId: string,
    primaryColor: string
  ): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: { primaryColor },
    });
  }
}
