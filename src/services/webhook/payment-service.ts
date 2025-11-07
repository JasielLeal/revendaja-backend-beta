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
    console.log("🎬 INICIANDO createCheckoutSession para userId:", userId);
    
    const user = await this.userRepository.findById(userId);

    if (!user) {
      console.log("❌ Usuário não encontrado para userId:", userId);
      throw new AppError("User not found", 404);
    }

    console.log("✅ Usuário encontrado:", user.email, "stripeCustomerId atual:", user.stripeCustomerId || "NULL");

    let customerId = user.stripeCustomerId;

    console.log("💳 DEBUG: Stripe Customer ID atual do usuário:", customerId || "❌ Nulo");

    // Se o usuário não tem um Stripe Customer ID, cria um
    if (!customerId) {
      console.log("🆕 Criando novo customer no Stripe para:", user.email);
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;
      console.log("✅ Customer criado no Stripe:", customerId);

      // Salva o Customer ID no banco
      console.log("💾 Salvando stripeCustomerId no banco de dados...");
      try {
        await this.userRepository.updateStripeCustomerId(userId, customerId);
        console.log("✅ stripeCustomerId salvo no banco para userId:", userId);
        
        // Verificar se realmente foi salvo
        const updatedUser = await this.userRepository.findById(userId);
        console.log("🔍 Verificação pós-update - stripeCustomerId:", updatedUser?.stripeCustomerId || "AINDA NULL!");
        
      } catch (error) {
        console.error("❌ ERRO ao salvar stripeCustomerId:", error);
        throw error;
      }
    } else {
      console.log("♻️ Usando stripeCustomerId existente:", customerId);
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
