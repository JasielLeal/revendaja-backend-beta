import { UserEntity } from "@/entities/user-entity";
import { prisma } from "@/lib/prisma";

import { UserRepository } from "./user-repository";

export class UserPrismaRepository implements UserRepository {
  async createUser(data: UserEntity): Promise<void> {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        tokenAccess: data.tokenAccess,
      },
    });

    return;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  async emailVerifyUpdate(email: string): Promise<void> {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerified: true,
      },
    });
  }

  async updatePassword(email: string, password: string): Promise<void> {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        password,
      },
    });
  }

  async updateTokenAccess(email: string, tokenAccess: string): Promise<void> {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        tokenAccess,
      },
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  async findByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<UserEntity | null> {
    const user = await prisma.user.findFirst({
      where: {
        stripeCustomerId,
      },
    });

    return user;
  }

  async updatePlan(userId: string, plan: string): Promise<void> {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        plan,
      },
    });
  }

  async updateStripeCustomerId(
    userId: string,
    stripeCustomerId: string
  ): Promise<void> {
    console.log(`💾 REPOSITORY: Atualizando stripeCustomerId para userId ${userId} -> ${stripeCustomerId}`);
    
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId,
      },
    });
    
    console.log(`✅ REPOSITORY: stripeCustomerId atualizado com sucesso`);
  }
}
