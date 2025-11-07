import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { prisma } from "@/lib/prisma";

export class StorePrismaRepository implements StoreRepository {
  async createStore(data: StoreEntity): Promise<void> {
    await prisma.store.create({
      data: {
        address: data.address,
        name: data.name,
        phone: data.phone,
        userId: data.userId,
        subdomain: data.subdomain,
      },
    });
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
}
