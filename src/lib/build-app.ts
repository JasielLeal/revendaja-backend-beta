// tests/test-app.ts
import { UserController } from "@/services/user/user-controller";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

export function buildApp() {
  const app = Fastify({
    logger: false,
  }).withTypeProvider<ZodTypeProvider>();

  // Configure os compiladores do Zod
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Registra o controller
  app.register(UserController);

  return app;
}
