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

export class PaymentService {
  constructor(private userRepository: UserPrismaRepository) {}

  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    let customerId = user.stripeCustomerId;

    

    // Se o usuário não tem um Stripe Customer ID, cria um
    if (!customerId) {
      

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;
      
      try {
        await this.userRepository.updateStripeCustomerId(userId, customerId);
      } catch (error) {
        console.error("❌ ERRO ao salvar stripeCustomerId:", error);
        throw error;
      }
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createPortalSession(userId: string, returnUrl: string) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.stripeCustomerId) {
      throw new AppError("User not found or no active subscription", 404);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: portalSession.url,
    };
  }

  async getUserSubscriptions(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });

    return subscriptions.data.map((sub) => ({
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: (sub as any).current_period_end || 0,
      priceId: sub.items.data[0]?.price.id,
      amount: sub.items.data[0]?.price.unit_amount,
      currency: sub.items.data[0]?.price.currency,
    }));
  }
}
