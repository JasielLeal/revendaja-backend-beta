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
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!customerId) {
      console.error("No customer ID in checkout session");
      return;
    }

    // Busca a subscription para obter detalhes do plano
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await this.updateUserPlan(customerId, subscription);
    }
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) {
      console.error("Missing customer ID in invoice");
      return;
    }

    // Para invoices, vamos buscar as subscriptions ativas do customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      // Atualiza com a primeira subscription ativa
      await this.updateUserPlan(customerId, subscriptions.data[0]);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    await this.updateUserPlan(customerId, subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Encontra o usuário pelo Stripe Customer ID
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`);
      return;
    }

    // Volta para o plano gratuito
    await this.userRepository.updatePlan(user.id, "Free");
    console.log(
      `User ${user.email} subscription cancelled, reverted to Free plan`
    );
  }

  private async updateUserPlan(
    customerId: string,
    subscription: Stripe.Subscription
  ) {
    // Encontra o usuário pelo Stripe Customer ID
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`);
      return;
    }

    // Pega o primeiro item da subscription (assumindo um produto por subscription)
    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem.price.id;

    // Mapeia os Price IDs do Stripe para nomes de planos
    const planMapping = this.getPlanMapping();
    const planName = planMapping[priceId] || "Free";

    // Atualiza o plano do usuário
    await this.userRepository.updatePlan(user.id, planName);

    console.log(`User ${user.email} plan updated to: ${planName}`);
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
