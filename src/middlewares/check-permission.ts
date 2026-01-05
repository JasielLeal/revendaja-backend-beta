import { FastifyReply, FastifyRequest } from "fastify";
import { Permission, hasPermission, Role } from "../config/permissions";
import { Plan, getPlanLimits } from "../config/plans";
import { AppError } from "../lib/AppError";
import { prisma } from "@/lib/prisma";

// Middleware factory para verificar permissão de role
export function requirePermission(permission: Permission) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const userRole = user.role as Role;

    if (!hasPermission(userRole, permission)) {
      throw new AppError("Você não tem permissão para realizar esta ação", 403);
    }
  };
}

// Middleware factory para verificar múltiplas permissões (OR - precisa de pelo menos uma)
export function requireAnyPermission(permissions: Permission[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const userRole = user.role as Role;
    const hasAny = permissions.some((p) => hasPermission(userRole, p));

    if (!hasAny) {
      throw new AppError("Você não tem permissão para realizar esta ação", 403);
    }
  };
}

// Middleware factory para verificar todas as permissões (AND - precisa de todas)
export function requireAllPermissions(permissions: Permission[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const userRole = user.role as Role;
    const hasAll = permissions.every((p) => hasPermission(userRole, p));

    if (!hasAll) {
      throw new AppError(
        "Você não tem todas as permissões necessárias para esta ação",
        403
      );
    }
  };
}

// Middleware para verificar se é Admin
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const user = req.user;

  if (!user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  const userRole = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (userRole?.role !== "Admin") {
    throw new AppError("Apenas administradores podem realizar esta ação", 403);
  }
}

// Middleware factory para verificar funcionalidade do plano
export function requirePlanFeature(
  feature: keyof ReturnType<typeof getPlanLimits>
) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const userPlan = (user.plan || "Free") as Plan;
    const limits = getPlanLimits(userPlan);
    const featureValue = limits[feature];

    // Se for boolean e false, não tem acesso
    if (typeof featureValue === "boolean" && !featureValue) {
      throw new AppError(
        `Seu plano (${userPlan}) não inclui esta funcionalidade. Faça upgrade para ter acesso.`,
        403
      );
    }
  };
}

// Middleware para verificar se o plano é pelo menos o especificado
export function requireMinPlan(minPlan: Plan) {
  const planOrder: Plan[] = ["Free", "Starter", "Exclusive"];

  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.user;

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const userPlan = (user.plan || "Free") as Plan;
    const userPlanIndex = planOrder.indexOf(userPlan);
    const minPlanIndex = planOrder.indexOf(minPlan);

    if (userPlanIndex < minPlanIndex) {
      throw new AppError(
        `Esta funcionalidade requer o plano ${minPlan} ou superior. Seu plano atual: ${userPlan}`,
        403
      );
    }
  };
}
