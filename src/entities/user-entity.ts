import { StoreEntity } from "./store-entity";

// src/entities/user.entity.ts
export class UserEntity {
  id?: string;
  name?: string;
  email: string;
  password: string;
  numberPhone: string;
  tokenAccess?: string;
  role?: string;
  plan?: string;
  stripeCustomerId?: string;
  emailVerified?: boolean;
  firstAccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  stores?: StoreEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
    this.role = this.role || "Member";
    this.plan = this.plan || "Free";
    this.emailVerified = this.emailVerified || false;
    this.firstAccess = this.firstAccess ?? true;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
