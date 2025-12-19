import {
  Plan,
  canCreateOrder,
  canAddProduct,
  getPlanLimits,
  PlanLimits,
} from "../config/plans";
import { OrderRepository } from "../services/order/order-repository";
import { StoreProductRepository } from "../services/store-product/store-product-repository";
import { AppError } from "./AppError";

// Função para pegar o primeiro e último dia do mês atual
function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    from: firstDay.toISOString().split("T")[0],
    to: lastDay.toISOString().split("T")[0],
  };
}

export interface UsageInfo {
  plan: Plan;
  limits: PlanLimits;
  usage: {
    monthlyOrders: number;
    totalProducts: number;
  };
  remaining: {
    monthlyOrders: number | "unlimited";
    products: number | "unlimited";
  };
}

export class PlanLimitsService {
  constructor(
    private orderRepository: OrderRepository,
    private storeProductRepository: StoreProductRepository
  ) {}

  // Verifica se pode criar uma nova venda
  async checkCanCreateOrder(storeId: string, plan: Plan): Promise<void> {
    const { from, to } = getMonthRange();
    const currentMonthlyOrders = await this.orderRepository.countOrdersInRange(
      storeId,
      from,
      to
    );

    if (!canCreateOrder(plan, currentMonthlyOrders)) {
      const limits = getPlanLimits(plan);
      throw new AppError(
        `Você atingiu o limite de ${limits.monthlyOrders} vendas mensais do plano ${plan}. ` +
          `Faça upgrade para continuar vendendo.`,
        403
      );
    }
  }

  // Verifica se pode adicionar um novo produto
  async checkCanAddProduct(storeId: string, plan: Plan): Promise<void> {
    const currentProducts =
      await this.storeProductRepository.countStoreProducts(storeId);

    if (!canAddProduct(plan, currentProducts)) {
      const limits = getPlanLimits(plan);
      throw new AppError(
        `Você atingiu o limite de ${limits.maxProducts} produtos do plano ${plan}. ` +
          `Faça upgrade para adicionar mais produtos.`,
        403
      );
    }
  }

  // Retorna informações de uso do plano
  async getUsageInfo(storeId: string, plan: Plan): Promise<UsageInfo> {
    const { from, to } = getMonthRange();

    const [monthlyOrders, totalProducts] = await Promise.all([
      this.orderRepository.countOrdersInRange(storeId, from, to),
      this.storeProductRepository.countStoreProducts(storeId),
    ]);

    const limits = getPlanLimits(plan);

    return {
      plan,
      limits,
      usage: {
        monthlyOrders,
        totalProducts,
      },
      remaining: {
        monthlyOrders:
          limits.monthlyOrders === -1
            ? "unlimited"
            : Math.max(0, limits.monthlyOrders - monthlyOrders),
        products:
          limits.maxProducts === -1
            ? "unlimited"
            : Math.max(0, limits.maxProducts - totalProducts),
      },
    };
  }

  // Retorna porcentagem de uso
  async getUsagePercentage(
    storeId: string,
    plan: Plan
  ): Promise<{ ordersPercentage: number; productsPercentage: number }> {
    const usage = await this.getUsageInfo(storeId, plan);
    const limits = usage.limits;

    return {
      ordersPercentage:
        limits.monthlyOrders === -1
          ? 0
          : Math.min(
              100,
              (usage.usage.monthlyOrders / limits.monthlyOrders) * 100
            ),
      productsPercentage:
        limits.maxProducts === -1
          ? 0
          : Math.min(
              100,
              (usage.usage.totalProducts / limits.maxProducts) * 100
            ),
    };
  }
}

// Factory function para criar o service
export function createPlanLimitsService(
  orderRepository: OrderRepository,
  storeProductRepository: StoreProductRepository
): PlanLimitsService {
  return new PlanLimitsService(orderRepository, storeProductRepository);
}
