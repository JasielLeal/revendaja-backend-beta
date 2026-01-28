import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string,
      name: string | null,
      email: string,
      plan: string,
      createdAt: string,
      firstAccess: boolean,
      token: string,
      store: boolean | null,
      storeInformation: {
        name: string | null,
        subdomain: string | null,
        phone: string | null,
        address: string | null,
        primaryColor: string | null,
      },
    };
  }
}
