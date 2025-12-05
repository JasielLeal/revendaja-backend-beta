import { OrderEntity } from "@/entities/order-entity";
import { OrderRepository } from "./order-repository";
import { StoreRepository } from "../store/store-repository";
import { generateOrderNumber } from "@/lib/utils";
import { StoreProductRepository } from "../store-product/store-product-repository";

export interface CreateOrderDTO {
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  items: Array<{
    storeProductId: string; // ← Mudei de 'id' para 'storeProductId'
    quantity: number;
  }>;
  total?: number; // Pode ser opcional se você calcular
  isDelivery?: boolean;
  deliveryStreet?: string;
  deliveryNumber?: string;
  deliveryNeighborhood?: string;
}

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private storeRepository: StoreRepository,
    private storeProductRepository: StoreProductRepository
  ) {}

  async createOrder(
    data: CreateOrderDTO,
    userId: string,
    status: string
  ): Promise<OrderEntity> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const orderNumber = await generateOrderNumber();

    // 1. Prepara os itens (busca preços e valida estoque)
    const { preparedItems, total } = await this.prepareOrderItems(data.items);

    // 2. Cria a order entity
    const orderEntity = new OrderEntity({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      storeId: store.id,
      items: preparedItems,
      orderNumber: orderNumber,
      total: data.total || total, // Usa o total fornecido ou o calculado
      status: status,
      paymentMethod: data.paymentMethod,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      isDelivery: data.isDelivery,
      deliveryStreet: data.deliveryStreet,
      deliveryNumber: data.deliveryNumber,
      deliveryNeighborhood: data.deliveryNeighborhood,
    });

    // 3. Salva no banco
    const createdOrder = await this.orderRepository.createOrderWithItems(
      orderEntity
    );

    // 4. Atualiza o estoque de cada produto
    for (const item of preparedItems) {
      const product = await this.storeProductRepository.findById(
        item.storeProductId
      );
      if (!product) continue;

      const newQuantity = product.quantity - item.quantity;
      await this.storeProductRepository.updatedStock(
        item.storeProductId,
        newQuantity
      );
    }

    return createdOrder;
  }

  private async prepareOrderItems(items: CreateOrderDTO["items"]) {
    const preparedItems = [];
    let total = 0;

    for (const item of items) {
      // Busca o produto para obter preço e nome
      const product = await this.storeProductRepository.findById(
        item.storeProductId
      );

      if (!product) {
        throw new Error(`Product not found: ${item.storeProductId}`);
      }

      // Valida estoque
      if (product.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        );
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      preparedItems.push({
        imgUrl: product.imgUrl,
        storeProductId: item.storeProductId,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
      });
    }

    return { preparedItems, total };
  }

  async onlineOrderCreate(data: CreateOrderDTO, subdomain: string) {
    const store = await this.storeRepository.findBySubdomain(subdomain);

    if (!store) {
      throw new Error("Store not found");
    }

    const orderNumber = await generateOrderNumber();

    // Prepara os itens (busca preços e valida estoque)
    const { preparedItems, total } = await this.prepareOrderItems(data.items);
    const orderEntity = new OrderEntity({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      storeId: store.id,
      items: preparedItems,
      orderNumber: orderNumber,
      total: data.total || total, // Usa o total fornecido ou o calculado
      status: "pending",
      paymentMethod: data.paymentMethod,
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      isDelivery: data.isDelivery,
      deliveryStreet: data.deliveryStreet,
      deliveryNumber: data.deliveryNumber,
      deliveryNeighborhood: data.deliveryNeighborhood,
    });

    await this.orderRepository.createOrderWithItems(orderEntity);

    return orderEntity
  }
  
  async getDashboardData(userId: string, from?: string, to?: string) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const orders = await this.orderRepository.getAllOrders(store.id, from, to);

    const totalOrders = orders.length;

    const approvedOrders = orders.filter((o) => o.status === "approved");
    const totalRevenue = approvedOrders.reduce((acc, o) => acc + o.total, 0);

    const estimatedProfit = Math.round(totalRevenue * 0.3);

    return {
      totalOrders,
      totalRevenue,
      estimatedProfit,
      orders,
    };
  }

  async getDashboardDataPagination(
    userId: string,
    page: number = 1,
    limit: number = 10,
    from?: string,
    to?: string,
    search?: string,
    status?: string
  ) {
    // Busca a loja do usuário
    const store = await this.storeRepository.findyStoreByUserId(userId);
    if (!store) throw new Error("Store not found");

    // Pega pedidos com paginação
    const { orders, pagination } =
      await this.orderRepository.getOrdersWithPagination(
        store.id,
        page,
        limit,
        from,
        to,
        search,
        status
      );

    console.log(orders);

    // Calcula métricas com base nos pedidos da página
    const totalOrders = orders.length;
    const approvedOrders = orders.filter((o) => o.status === "approved");
    const totalRevenue = approvedOrders.reduce(
      (acc, order) => acc + order.total,
      0
    );
    const estimatedProfit = Math.round(totalRevenue * 0.3);

    return {
      totalOrders,
      totalRevenue,
      estimatedProfit,
      orders,
      pagination, // total, pages, limit, page
    };
  }

  async getMetricsSales(userId: string, from?: string, to?: string) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Se não forneceu from e to, usa o mês atual
    let currentFrom = from;
    let currentTo = to;

    if (!from || !to) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      currentFrom = firstDay.toISOString().split("T")[0];
      currentTo = lastDay.toISOString().split("T")[0];
    }

    // Período atual
    const orders = await this.orderRepository.getAllOrders(
      store.id,
      currentFrom,
      currentTo
    );

    const totalOrders = orders.length;
    const approvedOrders = orders.filter((o) => o.status === "approved");
    const totalRevenue = approvedOrders.reduce((acc, o) => acc + o.total, 0);
    const estimatedProfit = Math.round(totalRevenue * 0.3);

    // Calcular período anterior (mesmo intervalo de dias)
    const fromDate = new Date(currentFrom);
    const toDate = new Date(currentTo);
    const diffDays = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Período anterior
    const previousToDate = new Date(fromDate);
    previousToDate.setDate(previousToDate.getDate() - 1);
    const previousFromDate = new Date(previousToDate);
    previousFromDate.setDate(previousFromDate.getDate() - diffDays);

    const previousFrom = previousFromDate.toISOString().split("T")[0];
    const previousTo = previousToDate.toISOString().split("T")[0];

    const previousOrders = await this.orderRepository.getAllOrders(
      store.id,
      previousFrom,
      previousTo
    );

    const previousTotalOrders = previousOrders.length;
    const previousApprovedOrders = previousOrders.filter(
      (o) => o.status === "approved"
    );
    const previousTotalRevenue = previousApprovedOrders.reduce(
      (acc, o) => acc + o.total,
      0
    );
    const previousEstimatedProfit = Math.round(previousTotalRevenue * 0.3);

    // Calcular diferença em valores absolutos
    const percentageChange = {
      orders: totalOrders - previousTotalOrders,
      revenue: totalRevenue - previousTotalRevenue,
      profit: estimatedProfit - previousEstimatedProfit,
    };

    return {
      totalOrders,
      totalRevenue,
      estimatedProfit,
      percentageChange,
      currentPeriod: {
        from: currentFrom,
        to: currentTo,
      },
      previousPeriod: {
        from: previousFrom,
        to: previousTo,
        totalOrders: previousOrders.length,
        totalRevenue: previousApprovedOrders.reduce(
          (acc, o) => acc + o.total,
          0
        ),
        estimatedProfit: Math.round(
          previousApprovedOrders.reduce((acc, o) => acc + o.total, 0) * 0.3
        ),
      },
    };
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatus: string
  ): Promise<OrderEntity> {
    // Verificar se a loja pertence ao usuário
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Verificar se a order existe e pertence à loja do usuário
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.storeId !== store.id) {
      throw new Error("Order does not belong to your store");
    }

    // Atualizar status da order
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      newStatus
    );

    return updatedOrder;
  }

  async deleteOrder(orderId: string, userId: string): Promise<void> {
    // Verificar se a loja pertence ao usuário
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    // Verificar se a order existe e pertence à loja do usuário
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.storeId !== store.id) {
      throw new Error("Order does not belong to your store");
    }

    // Deletar a order (vai deletar os itens em cascata)
    await this.orderRepository.delete(orderId);
  }

  async getRecentSales(userId: string): Promise<OrderEntity[]> {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const orders = await this.orderRepository.getAllOrders(
      store.id,
      undefined,
      undefined
    );

    // Retorna as 3 últimas vendas ordenadas por data de criação
    return orders
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }
}
