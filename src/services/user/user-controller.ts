import { verifyToken } from "@/middlewares/verify-token";
import { UserPrismaRepository } from "./user-prisma-repository";
import { UserService } from "./user-service";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import z from "zod";

export async function UserController(app: FastifyTypeInstance) {
  const userRepository = new UserPrismaRepository();
  const userService = new UserService(userRepository);

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
          numberPhone: z.string().min(8).max(15),
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
        const { email, name, password, numberPhone } = req.body;
        await userService.userCreate({ name, email, password, numberPhone });
        return reply.status(201).send();
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
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            id: z.string(),
            name: z.string().nullable(),
            email: z.string(),
            firstAccess: z.boolean(),
            tokenAcess: z.string(),
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
        description: "Verify user email",
        body: z.object({
          token: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string().default("Email verified successfully"),
          }),
          400: z.object({
            error: z.string().default("Invalid token"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { token } = req.body;
        await userService.verifyEmail(token);
        return reply.status(200).send();
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

  //reset password
  app.post(
    "/change-password",
    {
      schema: {
        tags: ["Users"],
        description: "Reset user password",
        body: z.object({
          token: z.string(),
          newPassword: z.string().min(6),
        }),
        response: {
          200: z.object({
            message: z.string().default("Password reset successfully"),
          }),
          400: z.object({
            error: z.string().default("Invalid token"),
          }),
        },
      },
    },
    async (req, reply) => {
      try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        return reply.status(200).send();
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
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
