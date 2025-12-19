// Definição de Plans e seus limites
export const PLANS = {
  Free: "Free",
  Starter: "Starter",
  Exclusive: "Exclusive",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

// Limites por funcionalidade
export interface PlanLimits {
  // Vendas
  monthlyOrders: number; // -1 = ilimitado

  // Produtos
  maxProducts: number; // -1 = ilimitado

  // Funcionalidades
  canUseOnlineStore: boolean;
  canUseWhatsappIntegration: boolean;
  canExportReports: boolean;

  // Suporte
  prioritySupport: boolean;
}

// Configuração de limites por plano
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  Free: {
    monthlyOrders: 10,
    maxProducts: 30,
    canUseOnlineStore: true,
    canUseWhatsappIntegration: false,
    canExportReports: false,
    prioritySupport: false,
  },
  Starter: {
    monthlyOrders: 40,
    maxProducts: 200,
    canUseOnlineStore: true,
    canUseWhatsappIntegration: false,
    canExportReports: true,
    prioritySupport: true,
  },
  Exclusive: {
    monthlyOrders: -1, // Ilimitado
    maxProducts: -1, // Ilimitado
    canUseOnlineStore: true,
    canUseWhatsappIntegration: true,
    canExportReports: true,
    prioritySupport: true,
  },
};

// Funções auxiliares
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.Free;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // Ilimitado
  return current < limit;
}

export function canCreateOrder(
  plan: Plan,
  currentMonthlyOrders: number
): boolean {
  const limits = getPlanLimits(plan);
  return isWithinLimit(currentMonthlyOrders, limits.monthlyOrders);
}

export function canAddProduct(plan: Plan, currentProducts: number): boolean {
  const limits = getPlanLimits(plan);
  return isWithinLimit(currentProducts, limits.maxProducts);
}

export function hasFeature(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  return false;
}
