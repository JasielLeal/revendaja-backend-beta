import z from "zod";
import { OrderService } from "./order-service";
import { FastifyTypeInstance } from "@/types/fastify-instance";
import { OrderPrismaRepository } from "./order-prisma-repository";
import { StorePrismaRepository } from "../store/store-prisma-repository";
import { StoreProductPrismaRepository } from "../store-product/store-product-prisma-repository";
import { verifyToken } from "@/middlewares/verify-token";

export async function OrderController(app: FastifyTypeInstance) {
  const orderRepository = new OrderPrismaRepository();
  const storeRepository = new StorePrismaRepository();
  const storeProductRepository = new StoreProductPrismaRepository();
  const orderService = new OrderService(
    orderRepository,
    storeRepository,
    storeProductRepository
  );

  app.post(
    "/orders",
    {
      schema: {
        tags: ["Orders"],
        description: "Create a new order",
        security: [{ bearerAuth: [] }], // Se estiver usando JWT
        body: z.object({
          customerName: z.string().min(1),
          customerPhone: z.string().min(1).optional(),
          status: z.string().min(1).optional(),
          paymentMethod: z.string(),
          items: z
            .array(
              z.object({
                storeProductId: z.string().min(1),
                quantity: z.number().min(1),
              })
            )
            .min(1, "Order must have at least one item"),
        }),
        response: {
          201: z.object({
            message: z.string().default("Order created successfully"),
            order: z.object({
              id: z.string(),
              orderNumber: z.string(),
              total: z.number(),
              status: z.string(),
              paymentMethod: z.string(),
            }),
          }),
          400: z.object({
            error: z.string(),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          409: z.object({
            error: z.string().default("Insufficient stock"),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { customerName, customerPhone, items, status, paymentMethod } =
          req.body;
        const userId = req.user.id; // Do seu middleware de autenticação

        const order = await orderService.createOrder(
          {
            customerName,
            customerPhone,
            items,
            paymentMethod,
          },
          userId,
          status
        );

        return reply.status(201).send({
          message: "Order created successfully",
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod,
          },
        });
      } catch (err: any) {
        // Tratamento específico de erros
        if (err.message.includes("not found")) {
          return reply.status(404).send({ error: err.message });
        }

        if (
          err.message.includes("stock") ||
          err.message.includes("insufficient")
        ) {
          return reply.status(409).send({ error: err.message });
        }

        if (err.message.includes("Product not found")) {
          return reply.status(400).send({ error: err.message });
        }

        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  app.get(
    "/dashboard",
    {
      schema: {
        tags: ["Orders"],
        description: "Get dashboard data",
        security: [{ bearerAuth: [] }],
        querystring: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
          })
          .partial(),
        response: {
          200: z.object({
            totalOrders: z.number(),
            totalRevenue: z.number(),
            estimatedProfit: z.number(),
            orders: z.array(
              z.object({
                id: z.string(),
                orderNumber: z.string(),
                status: z.string(),
                total: z.number(),
                customerName: z.string().optional(),
                customerPhone: z.string().optional(),
                storeId: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
                items: z.array(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    quantity: z.number(),
                    price: z.number(),
                    storeProductId: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  })
                ),
              })
            ),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { from, to } = req.query;
        const { id } = req.user;

        const dashboardData = await orderService.getDashboardData(id, from, to);

        const sanitizedOrders = dashboardData.orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: o.items.map((i) => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
            updatedAt: i.updatedAt.toISOString(),
          })),
        }));

        return reply.status(200).send({
          ...dashboardData,
          orders: sanitizedOrders,
        });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  app.get(
    "/dashboard/pagination",
    {
      schema: {
        tags: ["Orders"],
        description: "Get dashboard data with pagination",
        security: [{ bearerAuth: [] }],
        querystring: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
            search: z.string().optional(),
            status: z.string().optional(),
            page: z.string().optional(), // virá como string no query
            limit: z.string().optional(),
          })
          .partial(),
        response: {
          200: z.object({
            totalOrders: z.number(),
            totalRevenue: z.number(),
            estimatedProfit: z.number(),
            orders: z.array(
              z.object({
                id: z.string(),
                orderNumber: z.string(),
                status: z.string(),
                total: z.number(),
                customerName: z.string().optional(),
                customerPhone: z.string().optional(),
                storeId: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
                items: z.array(
                  z.object({
                    id: z.string(),
                    name: z.string(),
                    quantity: z.number(),
                    imgUrl: z.string(),
                    price: z.number(),
                    storeProductId: z.string(),
                    createdAt: z.string(),
                    updatedAt: z.string(),
                  })
                ),
              })
            ),
            pagination: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              pages: z.number(),
            }),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { from, to, search, status, page, limit } = req.query;
        const { id } = req.user;

        const dashboardData = await orderService.getDashboardDataPagination(
          id,
          page ? Number(page) : 1,
          limit ? Number(limit) : 10,
          from as string,
          to as string,
          search as string,
          status as string
        );

        // converte datas para string ISO
        const sanitizedOrders = dashboardData.orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: o.items.map((i) => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
            updatedAt: i.updatedAt.toISOString(),
          })),
        }));

        return reply.status(200).send({
          ...dashboardData,
          orders: sanitizedOrders,
        });
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  app.get(
    "/dashboard/metrics",
    {
      schema: {
        tags: ["Orders"],
        description: "Get orders metrics",
        security: [{ bearerAuth: [] }],
        querystring: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
          })
          .partial(),
        response: {
          200: z.object({
            totalOrders: z.number(),
            totalRevenue: z.number(),
            estimatedProfit: z.number(),
          }),
          401: z.object({
            error: z.string().default("Unauthorized"),
          }),
          404: z.object({
            error: z.string().default("Store not found"),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const { from, to } = req.query;
        const { id } = req.user;

        const dashboardData = await orderService.getMetricsSales(id, from, to);

        return reply.status(200).send(dashboardData);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );
}
