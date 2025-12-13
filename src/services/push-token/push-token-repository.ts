import { prisma } from "@/lib/prisma";

export interface CreatePushTokenDTO {
  token: string;
  provider: "expo" | "fcm" | "apns";
  userId: string;
  deviceId?: string;
  deviceName?: string;
}

export class PushTokenRepository {
  async create(data: CreatePushTokenDTO) {
    const store = await prisma.store.findUnique({
      where: { id: data.userId },
    });

    const pushToken = await prisma.pushToken.create({
      data: {
        token: data.token,
        provider: data.provider,
        userId: data.userId,
        storeId: store.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
      },
    });

    return pushToken;
  }

  async findByUserId(userId: string) {
    return prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
  }

  async findByStoreIdGroupedByProvider(storeId: string) {
    const tokens = await prisma.pushToken.findMany({
      where: {
        storeId,
        isActive: true,
      },
    });

    const grouped: Record<string, string[]> = {
      expo: [],
      fcm: [],
      apns: [],
    };

    tokens.forEach((token) => {
      if (token.provider === "expo") {
        grouped.expo.push(token.token);
      } else if (token.provider === "fcm") {
        grouped.fcm.push(token.token);
      } else if (token.provider === "apns") {
        grouped.apns.push(token.token);
      }
    });

    return grouped;
  }

  async findUserTokensByStoreIdGroupedByProvider(
    userId: string,
    storeId: string
  ) {
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        storeId,
        isActive: true,
      },
    });

    const grouped: Record<string, string[]> = {
      expo: [],
      fcm: [],
      apns: [],
    };

    tokens.forEach((token) => {
      if (token.provider === "expo") {
        grouped.expo.push(token.token);
      } else if (token.provider === "fcm") {
        grouped.fcm.push(token.token);
      } else if (token.provider === "apns") {
        grouped.apns.push(token.token);
      }
    });

    return grouped;
  }

  async findByToken(token: string) {
    return prisma.pushToken.findUnique({
      where: { token },
    });
  }

  async updateLastUsed(token: string) {
    return prisma.pushToken.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    });
  }

  async deactivate(token: string) {
    return prisma.pushToken.update({
      where: { token },
      data: { isActive: false },
    });
  }

  async deleteByToken(token: string) {
    return prisma.pushToken.delete({
      where: { token },
    });
  }

  async upsert(data: CreatePushTokenDTO) {
  

    const store = await prisma.store.findFirst({
      where: {
        userId: data.userId,
      },
    });
    
    return prisma.pushToken.upsert({
      where: { token: data.token },
      update: {
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        token: data.token,
        provider: data.provider,
        userId: data.userId,
        storeId: store.id,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
      },
    });
  }
}
