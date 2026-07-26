// Configuração do Stripe pra pagamentos.
// Docs: https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=stripe-hosted

import Stripe from "stripe";

// Chave secreta do Stripe (test environment)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurado");
}

// Instância do Stripe
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

// Preços por plano (em centavos)
export const PLAN_PRICES = {
  start: 7900,   // R$79
  pro: 14700,    // R$147
  agency: 29700, // R$297
} as const;

// IDs dos preços no Stripe (criar no Dashboard primeiro!)
// Depois substituir pelos IDs reais
export const STRIPE_PRICE_IDS = {
  start: process.env.STRIPE_PRICE_START || "price_1PLACEHOLDER_START",
  pro: process.env.STRIPE_PRICE_PRO || "price_1PLACEHOLDER_PRO",
  agency: process.env.STRIPE_PRICE_AGENCY || "price_1PLACEHOLDER_AGENCY",
} as const;

/**
 * Cria ou recupera customer no Stripe.
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<Stripe.Customer> {
  // Busca customer existente
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  // Cria novo customer
  return stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });
}

/**
 * Cria sessão de checkout.
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: keyof typeof PLAN_PRICES,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const customer = await getOrCreateCustomer(userId, email);

  return stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: STRIPE_PRICE_IDS[plan],
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan,
    },
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
  });
}

/**
 * Cria sessão de portal (gerenciar assinatura).
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Verifica assinatura ativa de um customer.
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  return subscriptions.data[0] || null;
}
