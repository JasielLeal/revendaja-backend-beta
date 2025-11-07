import { UserEntity } from "@/entities/user-entity";

export interface UserRepository {
  createUser(data: UserEntity): Promise<void>;
  findByEmail(email: string): Promise<UserEntity | null>;
  emailVerifyUpdate(email: string): Promise<void>;
  updatePassword(email: string, password: string): Promise<void>;
  updateTokenAccess(email: string, tokenAccess: string): Promise<void>;
  findById(id: string): Promise<UserEntity | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<UserEntity | null>;
  updatePlan(userId: string, plan: string): Promise<void>;
  updateStripeCustomerId(
    userId: string,
    stripeCustomerId: string
  ): Promise<void>;
}
