import { OrderEntity } from "@/entities/order-entity";
import { OrderRepository } from "./order-repository";
import { prisma } from "@/lib/prisma";
import { getDateRangeUTC } from "@/lib/utils";

export class OrderPrismaRepository implements OrderRepository {
  async createOrderWithItems(data: OrderEntity): Promise<OrderEntity> {
    const order = await prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        total: data.total,
        storeId: data.storeId,
        status: data.status,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        paymentMethod: data.paymentMethod,
        isDelivery: data.isDelivery,
        deliveryStreet: data.deliveryStreet,
        deliveryNumber: data.deliveryNumber,
        deliveryNeighborhood: data.deliveryNeighborhood,
        items: {
          create: data.items.map((item) => ({
            imgUrl: item.imgUrl,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            productType: item.productType || "catalog",
            storeProductId: item.storeProductId,
            storeProductCustomId: item.storeProductCustomId,
          })),
        },
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      },
      include: {
        store: true,
        items: {
          include: {
            storeProduct: true,
            storeProductCustom: true,
          },
        },
      },
    });

    return order as unknown as OrderEntity;
  }
  async getAllOrders(storeId: string, from?: string, to?: string) {
    const where: any = { storeId };

    if (from && to) {
      const { fromDate, toDate } = getDateRangeUTC(from, to);

      where.createdAt = {
        gte: fromDate,
        lte: toDate,
      };
    }

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });
  }

  async countOrdersInRange(storeId: string, from?: string, to?: string) {
    const where: any = { storeId };

    if (from || to) {
      const { fromDate, toDate } = getDateRangeUTC(
        from || to!, // se só tiver 'to', usamos ele também como 'from'
        to || from! // se só tiver 'from', usamos ele também como 'to'
      );

      where.createdAt = {
        gte: fromDate,
        lte: toDate,
      };
    }

    return prisma.order.count({ where });
  }

  async getOrdersPaginated(
    storeId: string,
    page: number,
    limit: number,
    from?: string,
    to?: string,
    search?: string,
    status?: string
  ) {
    const where: any = { storeId };

    if (from || to) {
      const { fromDate, toDate } = getDateRangeUTC(from || to!, to || from!);
      where.createdAt = { gte: fromDate, lte: toDate };
    }

    if (status) where.status = status;

    if (search) {
      where.customerName = { contains: search, mode: "insensitive" };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.order.count({ where });

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrdersWithPagination(
    storeId: string,
    page: number = 1,
    limit: number = 10,
    from?: string,
    to?: string,
    search?: string,
    status?: string
  ) {
    const where: any = { storeId };

    // filtro por data
    if (from || to) {
      const { fromDate, toDate } = getDateRangeUTC(from || to!, to || from!);
      where.createdAt = { gte: fromDate, lte: toDate };
    }

    // filtro por status
    if (status) where.status = status;

    // filtro por busca
    if (search) {
      where.customerName = { contains: search, mode: "insensitive" };
    }

    // busca os pedidos paginados
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
      skip: (page - 1) * limit,
      take: limit,
    });

    // conta todos os pedidos do filtro (para a paginação)
    const total = await prisma.order.count({ where });

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(orderId: string): Promise<OrderEntity | null> {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return null;
    }

    return order as OrderEntity;
  }

  async updateStatus(orderId: string, status: string): Promise<OrderEntity> {
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
      include: {
        items: true,
      },
    });

    return updatedOrder as OrderEntity;
  }

  async delete(orderId: string): Promise<void> {
    await prisma.order.delete({
      where: {
        id: orderId,
      },
    });
  }

  async updateDate(orderId: string, newDate: Date): Promise<OrderEntity> {
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        createdAt: newDate,
      },
      include: {
        items: true,
      },
    });

    return updatedOrder as OrderEntity;
  }

 async monthlySummary(storeId: string, year: number): Promise<{ label: string; fullLabel: string; value: number; brands: { name: string; value: number; }[]; }[]> {
    const months = [
      { label: "Jan", fullLabel: "Janeiro" },
      { label: "Feb", fullLabel: "Fevereiro" },
      { label: "Mar", fullLabel: "Março" },
      { label: "Apr", fullLabel: "Abril" },
      { label: "May", fullLabel: "Maio" },
      { label: "Jun", fullLabel: "Junho" },
      { label: "Jul", fullLabel: "Julho" },
      { label: "Aug", fullLabel: "Agosto" },
      { label: "Sep", fullLabel: "Setembro" },
      { label: "Oct", fullLabel: "Outubro" },
      { label: "Nov", fullLabel: "Novembro" },
      { label: "Dec", fullLabel: "Dezembro" },
    ];

    

    const results: {
      label: string;
      fullLabel: string;
      value: number;
      brands: { name: string; value: number }[];
    }[] = [];

    for (let m = 0; m < 12; m++) {
      const from = new Date(Date.UTC(year, m, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59, 999));

      

      const orders = await prisma.order.findMany({
        where: {
          storeId,
          createdAt: { gte: from, lte: to },
          status: { in: ["approved", "Approved"] },
        },
        include: {
          items: {
            include: {
              storeProduct: true,
              storeProductCustom: true,
            },
          },
        },
      });

      let monthTotal = 0;
      const companyMap: Record<string, number> = {};

      for (const order of orders) {
        monthTotal += Number(order.total || 0);

        for (const item of order.items || []) {
          const company =
            (item.storeProduct && (item.storeProduct as any).company) ||
            (item.storeProductCustom && (item.storeProductCustom as any).company) ||
            "unknown";

          const itemValue = Number(item.price || 0) * Number(item.quantity || 0);
          companyMap[company] = (companyMap[company] || 0) + itemValue;
        }
      }

      const brands = Object.keys(companyMap).map((name) => ({
        name,
        value: companyMap[name] / 100,
      }));

      results.push({
        label: months[m].label,
        fullLabel: months[m].fullLabel,
        value: monthTotal / 100,
        brands,
      });
    }

    return results;
}
}