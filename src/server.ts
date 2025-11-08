import "dotenv/config";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { UserController } from "./services/user/user-controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { ProductController } from "./services/product/product-controller";
import { StoreController } from "./services/store/store-controller";
import { StoreProductController } from "./services/store-product/store-product-controller";
import { OrderController } from "./services/order/order-controller";
import { CatalogController } from "./services/catalog/catalog-controller";
import { WebhookController } from "./services/webhook/webhook-controller";
import { PaymentController } from "./services/webhook/payment-controller";

const app = fastify().withTypeProvider<ZodTypeProvider>();

// IMPORTANTE: Registrar o content parser ANTES de tudo
// Capture raw request body for routes that need it (Stripe webhooks).
// We parse JSON as buffer, attach it to request.rawBody, and still return the parsed object
// so other routes keep working normally.
app.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (request, payload, done) => {
    try {
      // payload is a Buffer because of parseAs: 'buffer'
      // attach raw body for later use
      (request as any).rawBody = payload;
      const parsed = JSON.parse(payload.toString("utf8"));
      done(null, parsed);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Revendaja API",
      version: "1.0.0",
      description: "API documentation for Revendaja",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  transform: jsonSchemaTransform,
});

app.register(UserController, { prefix: "/api" });
app.register(StoreController, { prefix: "/api" });
app.register(ProductController, { prefix: "/api" });
app.register(StoreProductController, { prefix: "/api" });
app.register(OrderController, { prefix: "/api" });
app.register(CatalogController, { prefix: "/api" });
app.register(WebhookController, { prefix: "/api" });
app.register(PaymentController, { prefix: "/api" });

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`🚀 Server running on port ${port}`);
});
