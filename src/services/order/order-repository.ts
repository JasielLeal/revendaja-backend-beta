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
}
