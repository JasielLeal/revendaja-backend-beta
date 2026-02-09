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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new AppError(`Webhook signature verification failed: ${err}`, 400);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;

        default:
          break;
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
      console.error("❌ ERRO: Nenhum customer ID na checkout session");
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
      console.error("❌ ERRO: Customer ID ausente no invoice");
      return;
    }

    // SOLUÇÃO: Buscar o customer no Stripe para pegar o email
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      console.error("❌ ERRO: Customer foi deletado no Stripe");
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;

    if (!customerEmail) {
      console.error("❌ ERRO: Customer não tem email");
      return;
    }

    // Buscar usuário pelo email ao invés do stripeCustomerId
    const user = await this.userRepository.findByEmail(customerEmail);

    if (!user) {
      console.error(`❌ ERRO: Usuário não encontrado para email: ${customerEmail}`);
      return;
    }

    // Aproveitar para salvar o stripeCustomerId se não estiver salvo
    if (!user.stripeCustomerId) {
      await this.userRepository.updateStripeCustomerId(user.id, customerId);
    }

    // Para invoices, vamos buscar as subscriptions ativas do customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      await this.updateUserPlanWithUser(user, subscriptions.data[0]);
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
      console.error(`❌ ERRO: Usuário não encontrado para customer ID: ${customerId}`);
      return;
    }

    // Volta para o plano gratuito
    await this.userRepository.updatePlan(user.id, "Free");
  }

  private async updateUserPlan(
    customerId: string,
    subscription: Stripe.Subscription
  ) {
    const user = await this.userRepository.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(`❌ ERRO: Usuário não encontrado para customer ID: ${customerId}`);
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
  }

  private async updateUserPlanWithUser(
    user: any,
    subscription: Stripe.Subscription
  ) {
    // Pega o primeiro item da subscription (assumindo um produto por subscription)
    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem.price.id;

    // Mapeia os Price IDs do Stripe para nomes de planos
    const planMapping = this.getPlanMapping();
    const planName = planMapping[priceId] || "Free";

    // Atualiza o plano do usuário
    await this.userRepository.updatePlan(user.id, planName);
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
