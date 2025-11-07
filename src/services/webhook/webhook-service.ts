import Stripe from "stripe";
import { UserPrismaRepository } from "../user/user-prisma-repository";
import { AppError } from "@/lib/AppError";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});

export class WebhookService {
  constructor(private userRepository: UserPrismaRepository) {}

  async processStripeWebhook(signature: string, body: string | Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError("Webhook secret not configured", 500);
    }

    let event: Stripe.Event;

    try {
      console.log("Constructing Stripe event...");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("Event constructed successfully:", event.type);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new AppError(`Webhook signature verification failed: ${err}`, 400);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          console.log("Processing checkout.session.completed");
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case "invoice.payment_succeeded":
          console.log("Processing invoice.payment_succeeded");
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;

        case "customer.subscription.updated":
          console.log("Processing customer.subscription.updated");
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          console.log("Processing customer.subscription.deleted");
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (processingError) {
      console.error("Error processing webhook event:", processingError);
      throw processingError;
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ) {
    console.log("💳 INICIANDO: handleCheckoutSessionCompleted");
    console.log("🆔 Session ID:", session.id);

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    console.log("👤 Customer ID:", customerId || "❌ Não encontrado");
    console.log("📋 Subscription ID:", subscriptionId || "❌ Não encontrado");

    if (!customerId) {
      console.error("❌ ERRO: Nenhum customer ID na checkout session");
      return;
    }

    // Busca a subscription para obter detalhes do plano
    if (subscriptionId) {
      console.log("🔍 Buscando detalhes da subscription...");
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      console.log(
        "📋 Subscription encontrada:",
        subscription.id,
        "Status:",
        subscription.status
      );
      await this.updateUserPlan(customerId, subscription);
    } else {
      console.log("ℹ️ Nenhuma subscription associada ao checkout");
    }

    console.log("✅ handleCheckoutSessionCompleted finalizado");
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log("💰 INICIANDO: handleInvoicePaymentSucceeded");
    console.log("🧾 Invoice ID:", invoice.id);

    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;

    console.log("👤 Customer ID:", customerId || "❌ Não encontrado");

    if (!customerId) {
      console.error("❌ ERRO: Customer ID ausente no invoice");
      return;
    }

    // Para invoices, vamos buscar as subscriptions ativas do customer
    console.log("🔍 Buscando subscriptions ativas do customer...");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    console.log(
      "📋 Subscriptions ativas encontradas:",
      subscriptions.data.length
    );

    if (subscriptions.data.length > 0) {
      console.log(
        "✅ Atualizando plano com primeira subscription ativa:",
        subscriptions.data[0].id
      );
      // Atualiza com a primeira subscription ativa
      await this.updateUserPlan(customerId, subscriptions.data[0]);
    } else {
      console.log("⚠️ Nenhuma subscription ativa encontrada para o customer");
    }

    console.log("✅ handleInvoicePaymentSucceeded finalizado");
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log("🔄 INICIANDO: handleSubscriptionUpdated");
    console.log("📋 Subscription ID:", subscription.id);
    console.log("📊 Status:", subscription.status);

    const customerId = subscription.customer as string;
    console.log("👤 Customer ID:", customerId);

    await this.updateUserPlan(customerId, subscription);
    console.log("✅ handleSubscriptionUpdated finalizado");
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log("❌ INICIANDO: handleSubscriptionDeleted");
    console.log("📋 Subscription ID:", subscription.id);

    const customerId = subscription.customer as string;
    console.log("👤 Customer ID:", customerId);

    // Encontra o usuário pelo Stripe Customer ID
    console.log("🔍 Buscando usuário para cancelamento...");
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(
        `❌ ERRO: Usuário não encontrado para customer ID: ${customerId}`
      );
      return;
    }

    console.log("✅ Usuário encontrado:", user.email);

    // Volta para o plano gratuito
    console.log("💾 Revertendo para plano Free...");
    await this.userRepository.updatePlan(user.id, "Free");
    console.log(
      `✅ SUCCESS: Usuário ${user.email} teve subscription cancelada, revertido para plano Free`
    );
    console.log("✅ handleSubscriptionDeleted finalizado");
  }

  private async updateUserPlan(
    customerId: string,
    subscription: Stripe.Subscription
  ) {
    console.log("🔄 INICIANDO: updateUserPlan");
    console.log("👤 Customer ID recebido:", customerId);
    console.log("📋 Subscription ID:", subscription.id);
    console.log("📊 Status da subscription:", subscription.status);

    // Encontra o usuário pelo Stripe Customer ID
    console.log("🔍 Buscando usuário no banco de dados...");
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(
        `❌ ERRO: Usuário não encontrado para customer ID: ${customerId}`
      );
      return;
    }

    console.log("✅ Usuário encontrado:", user.email, "ID:", user.id);

    // Pega o primeiro item da subscription (assumindo um produto por subscription)
    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem.price.id;

    console.log("💰 Price ID da subscription:", priceId);

    // Mapeia os Price IDs do Stripe para nomes de planos
    const planMapping = this.getPlanMapping();
    const planName = planMapping[priceId] || "Free";

    console.log("📦 Plano mapeado:", planName);
    console.log("🗺️ Mapping disponível:", JSON.stringify(planMapping, null, 2));

    // Atualiza o plano do usuário
    console.log("💾 Atualizando plano no banco de dados...");
    await this.userRepository.updatePlan(user.id, planName);

    console.log(
      `✅ SUCCESS: Usuário ${user.email} teve o plano atualizado para: ${planName}`
    );
    console.log("✅ updateUserPlan finalizado");
  }

  private getPlanMapping(): Record<string, string> {
    // Mapeia os Price IDs do Stripe para os nomes dos planos
    // Você deve substituir pelos seus Price IDs reais do Stripe
    return {
      [process.env.STRIPE_PRICE_ID_STARTER || ""]: "Starter",
      // Adicione mais planos conforme necessário
    };
  }
}
