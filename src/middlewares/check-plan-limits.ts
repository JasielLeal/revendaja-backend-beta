import { canAddProduct, Plan } from "@/config/plans";
import { prisma } from "@/lib/prisma";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export async function CheckPlanLimits(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.user) {
    return reply.status(401).send({ error: "Usuário não autenticado" });
  }

  const { id: userId } = req.user;

  // 🔹 1. Buscar plano do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) {
    return reply.status(404).send({ error: "Usuário não encontrado" });
  }

  const store = await prisma.store.findFirst({
    where: {
      userId: userId,
    },
  });

  // 🔹 2. Contar produtos atuais
  const productsCount = await prisma.storeProduct.count({
    where: { storeId: store?.id },
  });

  const customProductsCount = await prisma.storeProductCustom.count({
    where: { storeId: store?.id },
  });

  // 🔹 3. Usar regra centralizada
  const allowed = canAddProduct(user.plan as Plan, productsCount + customProductsCount);

  if (!allowed) {
    return reply.status(403).send({
      error: "Limite de produtos do seu plano atingido",
    });
  }
}
