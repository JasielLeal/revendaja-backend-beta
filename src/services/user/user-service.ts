import { UserEntity } from "@/entities/user-entity";
import { UserRepository } from "./user-repository";
import { AppError } from "@/lib/AppError";
import { hash, compare } from "bcrypt";
import { sendEmail } from "@/mail/transport";
import { sendVerificationEmail } from "@/mail/templates/send-verification-email";
import jwt from "jsonwebtoken";
import { forgotPassword } from "@/mail/templates/forgot-password";
import { passwordChanged } from "@/mail/templates/password-changed";
import { sendWhatsappMessage } from "@/whatsapp/sendWhatsapp";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async userCreate(data: UserEntity): Promise<void> {
    const userAlreadyExists = await this.userRepository.findByEmail(data.email);

    if (userAlreadyExists) {
      throw new AppError("User already exists", 409);
    }

    const passwordHash = await hash(data.password, 6);

    const randomNumbersSix = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await this.userRepository.createUser({
      name: data.name,
      email: data.email,
      password: passwordHash,
      tokenAccess: randomNumbersSix,
    });

    sendEmail({
      to: data.email,
      subject: "Bem-vindo ao Revendaja!",
      html: sendVerificationEmail(data.name, randomNumbersSix),
    });

    return;
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{
    id: string;
    name: string | null;
    email: string;
    firstAccess: boolean;
    tokenAcess: string;
  }> {
    console.time("signin");
    console.time("find");
    const user = await this.userRepository.findByEmail(email);
    console.timeEnd("find");
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    console.time("bcrypt");
    const doesPasswordMatch = await compare(password, user.password);
    console.timeEnd("bcrypt");

    if (!doesPasswordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.emailVerified === false) {
      throw new AppError("Email not verified", 401);
    }

    console.time("jwt");
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    console.timeEnd("jwt");
    console.timeEnd("signin");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      firstAccess: user.firstAccess,
      tokenAcess: token,
    };
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.emailVerified) {
      throw new AppError("Email already verified", 400);
    }

    if (user.tokenAccess !== code) {
      throw new AppError("Invalid verification code", 400);
    }

    await this.userRepository.emailVerifyUpdate(email);
    await this.userRepository.updateTokenAccess(email, "");

    return;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }
    const tokenAccess = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    await this.userRepository.updateTokenAccess(user.email, tokenAccess);

    sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: forgotPassword(
        user.name,
        `http://localhost:3000/change-password?token=${tokenAccess}`
      ),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: any;
    payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      throw new AppError("Invalid token", 400);
    }

    const passwordHash = await hash(newPassword, 6);

    await this.userRepository.updatePassword(user.email, passwordHash);
    await this.userRepository.updateTokenAccess(user.email, "");
    sendEmail({
      to: user.email,
      subject: "Password Successfully Reset",
      html: passwordChanged(user.name),
    });
  }

  async me(userId: string): Promise<{
    id: string;
    email: string;
    name?: string;
    role: string;
    plan: string;
    stripeCustomerId?: string;
  } | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
    };
  }
}
