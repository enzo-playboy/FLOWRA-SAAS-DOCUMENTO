// Webhook do Stripe pra processar eventos de pagamento.
// POST /api/webhooks/stripe

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Cliente Supabase com service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Signature não fornecida" },
        { status: 400 }
      );
    }

    // Verifica assinatura do webhook
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET não configurado");
      return NextResponse.json(
        { error: "Webhook não configurado" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Erro na verificação do webhook:", err.message);
      return NextResponse.json(
        { error: "Signature inválida" },
        { status: 400 }
      );
    }

    // Processa eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

// Handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error("Metadata faltando no checkout:", session.id);
    return;
  }

  // Cria assinatura no Supabase
  await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_subscription_id: session.subscription as string,
    plan,
    status: "active",
  });

  // Atualiza plano do usuário
  await supabase
    .from("users")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);

  // Registra evento
  await supabase.rpc("log_event", {
    p_event_type: "subscription.created",
    p_entity_type: "subscription",
    p_entity_id: session.subscription as string,
    p_payload: JSON.stringify({ userId, plan, sessionId: session.id }),
  });

  console.log(`Assinatura criada: ${userId} → ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan;

  if (!userId) return;

  // Atualiza status da assinatura
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status === "active" ? "active" : "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  console.log(`Assinatura atualizada: ${subscription.id} → ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  // Marca como cancelada
  await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Reverte plano do usuário pra free
  await supabase
    .from("users")
    .update({ plan: "free", updated_at: new Date().toISOString() })
    .eq("id", userId);

  console.log(`Assinatura cancelada: ${subscription.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription as string;

  // Marca como past_due
  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  console.log(`Pagamento falhou: ${subscriptionId}`);
}
