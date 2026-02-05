import { StoreEntity } from "@/entities/store-entity";
import { StoreRepository } from "./store-repository";
import { prisma } from "@/lib/prisma";
import { StoreSettingsEntity } from "@/entities/store-settings";

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

  async updateStoreInformation(storeId: string, data: Partial<StoreEntity>): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        primaryColor: data.primaryColor,
        logo: data.logo,
      },
    });

    return;
  }

  async updateSubdomain(storeId: string, subdomain: string): Promise<void> {
    await prisma.store.update({
      where: { id: storeId },
      data: { subdomain },
    });
  }

  async storeSettings(storeId: string): Promise<StoreSettingsEntity | null> {
    const settings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });

    if (!settings) {
      return null;
    }

    return new StoreSettingsEntity(settings);
  }

  async createStoreSettings(data: StoreSettingsEntity): Promise<StoreSettingsEntity> {
    const settings = await prisma.storeSettings.create({
      data: {
        storeId: data.storeId,
        pixKey: data.pixKey,
        pixName: data.pixName,
      },
    });

    return new StoreSettingsEntity(settings);
  }

  async updateStoreSettings(
    storeId: string,
    data: Partial<StoreSettingsEntity>
  ): Promise<StoreSettingsEntity> {
    const settings = await prisma.storeSettings.update({
      where: { storeId },
      data: {
        pixKey: data.pixKey,
        pixName: data.pixName,
      },
    });

    return new StoreSettingsEntity(settings);
  }
}
