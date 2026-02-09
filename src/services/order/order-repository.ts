import { OrderEntity } from "@/entities/order-entity";

export interface OrderRepository {
  createOrderWithItems(data: OrderEntity): Promise<OrderEntity>;
  getAllOrders(storeId: string, from: string, to: string);
  countOrdersInRange(storeId: string, from?: string, to?: string);
  getOrdersPaginated(
    storeId: string,
    page: number,
    limit: number,
    from?: string,
    to?: string,
    search?: string,
    status?: string
  );
  getOrdersWithPagination(
    storeId: string,
    page: number,
    limit: number,
    from?: string,
    to?: string,
    search?: string,
    status?: string
  );

  findById(orderId: string): Promise<OrderEntity | null>;
  updateStatus(orderId: string, status: string): Promise<OrderEntity>;
  delete(orderId: string): Promise<void>;
  updateDate(orderId: string, newDate: Date): Promise<OrderEntity>;
  monthlySummary(
  storeId: string,
  year: number
): Promise<{
  label: string
  fullLabel: string
  value: number
  brands: {
    name: string
    value: number
  }[]
}[]>
}
