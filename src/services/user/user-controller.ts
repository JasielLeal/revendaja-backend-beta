import { verifyToken } from "@/middlewares/verify-token";
import { UserPrismaRepository } from "./user-prisma-repository";
import { UserService } from "./user-service";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import z from "zod";
import { StorePrismaRepository } from "../store/store-prisma-repository";

export async function UserController(app: FastifyTypeInstance) {
  const userRepository = new UserPrismaRepository();
  const storeRepository = new StorePrismaRepository();
  const userService = new UserService(userRepository, storeRepository);

  //criar users
  app.post(
    "/users",
    {
      schema: {
        tags: ["Users"],
        description: "Create a new user",
        body: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            message: z.string().default("User created successfully"),
          }),
          409: z.object({
            error: z.string().default("User already exists"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email, name, password } = req.body;
        await userService.userCreate({ name, email, password });
        return reply.status(201).send();
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //check email availability
  app.post(
    "/users/check-email",
    {
      schema: {
        tags: ["Users"],
        description: "Check if email is available",
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            available: z.boolean(),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email } = req.body;
        const result = await userService.checkEmailAvailability(email);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //login
  app.post(
    "/signin",
    {
      schema: {
        tags: ["Users"],
        description: "User sign in",
        body: z.object({
          email: z.string().email().default("jasieloficial@hotmail.com"),
          password: z.string().min(6).default("123456"),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            plan: z.string(),
            createdAt: z.string(),
            firstAccess: z.boolean(),
            token: z.string(),
            store: z.boolean().nullable(),
          }),
          401: z.object({
            error: z.string().default("Invalid email or password"),
          }),
          400: z.object({
            error: z.string().default("Email not verified"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email, password } = req.body;
        const signInResult = await userService.signIn(email, password);
        return reply.status(201).send(signInResult);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //email verification
  app.put(
    "/verify-email",
    {
      schema: {
        tags: ["Users"],
        description: "Verify user email with 6-digit code",
        body: z.object({
          email: z.string().email(),
          code: z.string().length(6),
        }),
        response: {
          200: z.object({
            message: z.string().default("Email verified successfully"),
          }),
          400: z.object({
            error: z.string().default("Invalid verification code"),
          }),
          404: z.object({
            error: z.string().default("User not found"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email, code } = req.body;
        await userService.verifyEmail(email, code);
        return reply
          .status(200)
          .send({ message: "Email verified successfully" });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //forgot password
  app.post(
    "/forgot-password",
    {
      schema: {
        tags: ["Users"],
        description: "Request password reset",
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            message: z.string().default("Password reset email sent"),
          }),
          404: z.object({
            error: z.string().default("User not found"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email } = req.body;
        await userService.forgotPassword(email);
        return reply.status(200).send();
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //verify otp
  app.post(
    "/verify-otp",
    {
      schema: {
        tags: ["Users"],
        description: "Verify if OTP code belongs to user",
        body: z.object({
          email: z.string().email(),
          otpCode: z.string().length(6),
        }),
        response: {
          200: z.object({
            valid: z.boolean(),
          }),
          404: z.object({
            error: z.string().default("User not found"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email, otpCode } = req.body;
        const result = await userService.verifyOtp(email, otpCode);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //reset password
  app.post(
    "/change-password",
    {
      schema: {
        tags: ["Users"],
        description: "Reset user password",
        body: z.object({
          email: z.string().email(),
          otpCode: z.string().length(6),
          newPassword: z.string().min(6),
        }),
        response: {
          200: z.object({
            message: z.string().default("Password reset successfully"),
          }),
          400: z.object({
            error: z.string().default("Invalid or expired code"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { email, otpCode, newPassword } = req.body;
        await userService.resetPassword(email, otpCode, newPassword);
        return reply.status(200).send();
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  //Verificar token
  app.get(
    "/verify-token",
    {
      schema: {
        tags: ["Users"],
        description: "Verify if token is valid",
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            valid: z.boolean(),
            user: z.object({
              id: z.string(),
              email: z.string(),
              name: z.string().nullable(),
              role: z.string(),
              plan: z.string().optional(),
              firstAccess: z.boolean().optional(),
            }),
          }),
          401: z.object({
            error: z.string().default("Invalid or expired token"),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        // Se chegou aqui, o token é válido (passou pelo middleware)
        return reply.status(200).send({
          valid: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            plan: req.user.plan,
            firstAccess: req.user.firstAccess,
          },
        });
      } catch (err: any) {
        return reply.status(401).send({ error: "Invalid or expired token" });
      }
    }
  );

  //Informações do usuário
  app.get(
    "/me",
    {
      schema: {
        tags: ["Users"],
        description: "Reset user password",
        response: {
          200: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            role: z.string(),
            plan: z.string(),
            stripeCustomerId: z.string().nullable(),
          }),
          400: z.object({
            error: z.string().default("Invalid token"),
          }),
          500: z.object({
            error: z.string().default("Erro do servidor"),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const userId = req.user.id;

        const user = await userService.me(userId);
        return reply.status(200).send(user);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}
