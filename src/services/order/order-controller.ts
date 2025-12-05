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
        body: z
          .object({
            customerName: z.string().min(1),
            customerPhone: z.string().min(1).optional(),
            status: z.string().min(1).optional(),
            paymentMethod: z.string(),
            createdAt: z.string().optional(),
            isDelivery: z.boolean().optional().default(false),
            deliveryStreet: z.string().min(1).optional(),
            deliveryNumber: z.string().min(1).optional(),
            deliveryNeighborhood: z.string().min(1).optional(),
            items: z
              .array(
                z.object({
                  storeProductId: z.string().min(1),
                  quantity: z.number().min(1),
                })
              )
              .min(1, "Order must have at least one item"),
          })
          .refine(
            (payload) =>
              !payload.isDelivery ||
              (payload.deliveryStreet &&
                payload.deliveryNumber &&
                payload.deliveryNeighborhood),
            {
              message: "Delivery address is required when isDelivery is true",
              path: ["deliveryStreet"],
            }
          ),
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
        const {
          customerName,
          customerPhone,
          items,
          status,
          paymentMethod,
          createdAt,
          isDelivery,
          deliveryStreet,
          deliveryNumber,
          deliveryNeighborhood,
        } = req.body;
        const userId = req.user.id; // Do seu middleware de autenticação

        const order = await orderService.createOrder(
          {
            customerName,
            customerPhone,
            createdAt,
            items,
            paymentMethod,
            isDelivery,
            deliveryStreet,
            deliveryNumber,
            deliveryNeighborhood,
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

  app.post(
    "/orders/online",
    {
      schema: {
        tags: ["Orders"],
        description: "Create a new online order",
        security: [{ bearerAuth: [] }], // Se estiver usando JWT
        body: z
          .object({
            customerName: z.string().min(1),
            customerPhone: z.string().min(1).optional(),
            paymentMethod: z.string(),
            subdomain: z.string().min(1),
            createdAt: z.string().optional(),
            isDelivery: z.boolean().optional().default(false),
            deliveryStreet: z.string().min(1).optional(),
            deliveryNumber: z.string().min(1).optional(),
            deliveryNeighborhood: z.string().min(1).optional(),
            items: z
              .array(
                z.object({
                  storeProductId: z.string().min(1),
                  quantity: z.number().min(1),
                })
              )
              .min(1, "Order must have at least one item"),
          })
          .refine(
            (payload) =>
              !payload.isDelivery ||
              (payload.deliveryStreet &&
                payload.deliveryNumber &&
                payload.deliveryNeighborhood),
            {
              message: "Delivery address is required when isDelivery is true",
              path: ["deliveryStreet"],
            }
          ),
      },
    },

    async (req, reply) => {
      try {
        const {
          customerName,
          customerPhone,
          items,
          subdomain,
          paymentMethod,
          createdAt,
          isDelivery,
          deliveryStreet,
          deliveryNumber,
          deliveryNeighborhood,
        } = req.body;
        // Do seu middleware de autenticação
        const order = await orderService.onlineOrderCreate(
          {
            customerName,
            customerPhone,
            items,
            paymentMethod,
            createdAt,
            isDelivery,
            deliveryStreet,
            deliveryNumber,
            deliveryNeighborhood,
          },
         subdomain
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
                paymentMethod: z.string(),
                customerName: z.string().optional(),
                customerPhone: z.string().nullable().optional(),
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
        console.log("req chegou aqui");
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
            percentageChange: z.object({
              orders: z.number(),
              revenue: z.number(),
              profit: z.number(),
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
        const { from, to } = req.query;
        const { id } = req.user;

        const dashboardData = await orderService.getMetricsSales(id, from, to);

        return reply.status(200).send(dashboardData);
      } catch (err: any) {
        return reply.status(err.statusCode || 500).send({ error: err.message });
      }
    }
  );

  // Alterar status da order
  app.patch(
    "/orders/:id/status",
    {
      schema: {
        tags: ["Orders"],
        description: "Update order status",
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          status: z.enum(["pending", "approved", "cancelled", "delivered"]),
        }),
        response: {
          200: z.object({
            message: z.string(),
            order: z.object({
              id: z.string(),
              status: z.string(),
            }),
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
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
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const updatedOrder = await orderService.updateOrderStatus(
          id,
          userId,
          status
        );

        return reply.status(200).send({
          message: "Status da order atualizado com sucesso",
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
          },
        });
      } catch (error: any) {
        console.log("❌ ERRO ao alterar status da order:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Order não encontrada",
          });
        }

        if (error.message.includes("not belong")) {
          return reply.status(400).send({
            error: "Order não pertence à sua loja",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Deletar order
  app.delete(
    "/orders/:id",
    {
      schema: {
        tags: ["Orders"],
        description: "Delete an order",
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
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
        const { id } = req.params;
        const userId = req.user.id;

        await orderService.deleteOrder(id, userId);

        return reply.status(200).send({
          message: "Order deletada com sucesso",
        });
      } catch (error: any) {
        console.log("❌ ERRO ao deletar order:", error);

        if (error.message.includes("not found")) {
          return reply.status(404).send({
            error: "Order não encontrada",
          });
        }

        if (error.message.includes("not belong")) {
          return reply.status(400).send({
            error: "Order não pertence à sua loja",
          });
        }

        return reply.status(500).send({
          error: "Erro interno: " + error.message,
        });
      }
    }
  );

  // Buscar últimas 3 vendas
  app.get(
    "/orders/recent-sales",
    {
      schema: {
        tags: ["Orders"],
        description: "Get the 3 most recent sales",
        security: [{ bearerAuth: [] }],
        response: {
          200: z.array(
            z.object({
              id: z.string().optional(),
              orderNumber: z.string(),
              customerName: z.string().nullable().optional(),
              customerPhone: z.string().nullable().optional(),
              total: z.number(),
              status: z.string().optional(),
              paymentMethod: z.string(),
              createdAt: z.date().optional(),
              items: z
                .array(
                  z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    quantity: z.number(),
                    price: z.number(),
                    imgUrl: z.string().nullable().optional(),
                  })
                )
                .optional(),
            })
          ),
          500: z.object({
            error: z.string(),
          }),
        },
      },
      preHandler: [verifyToken],
    },
    async (req, reply) => {
      try {
        const userId = req.user.id;
        const recentSales = await orderService.getRecentSales(userId);

        return reply.status(200).send(recentSales);
      } catch (error: any) {
        console.log("❌ ERRO ao buscar vendas recentes:", error);
        return reply.status(500).send({
          error: "Erro ao buscar vendas recentes: " + error.message,
        });
      }
    }
  );
}
