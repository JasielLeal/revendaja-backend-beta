import { OrderEntity } from "@/entities/order-entity";
import { OrderRepository } from "./order-repository";
import { StoreRepository } from "../store/store-repository";
import { generateOrderNumber } from "@/lib/utils";
import { StoreProductRepository } from "../store-product/store-product-repository";

export interface CreateOrderDTO {
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    storeProductId: string; // ← Mudei de 'id' para 'storeProductId'
    quantity: number;
  }>;
  total?: number; // Pode ser opcional se você calcular
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

  async getDashboardData(userId: string, from?: string, to?: string) {
    const store = await this.storeRepository.findyStoreByUserId(userId);

    if (!store) {
      throw new Error("Store not found");
    }

    const orders = await this.orderRepository.getAllOrders(store.id, from, to);

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

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

    // Calcula métricas com base nos pedidos da página
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
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

    const orders = await this.orderRepository.getAllOrders(store.id, from, to);

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);

    const estimatedProfit = Math.round(totalRevenue * 0.3);

    return {
      totalOrders,
      totalRevenue,
      estimatedProfit,
    };
  }
}
