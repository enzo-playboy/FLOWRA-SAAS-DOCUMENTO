// Rota pra criar assinatura (Stripe/Asaas).
// POST /api/subscribe

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Cliente Supabase com service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SubscribeInput = {
  plan: "start" | "pro" | "agency";
  payment_method: "stripe" | "asaas";
  payment_token?: string; // Token do cartão/PIX
};

// Preços por plano (em centavos)
const PLAN_PRICES = {
  start: 7900,   // R$79
  pro: 14700,    // R$147
  agency: 29700, // R$297
};

export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticação
    const auth = await requireAuth(req);

    // 2. Valida input
    const body: SubscribeInput = await req.json();

    if (!body.plan || !body.payment_method) {
      return NextResponse.json(
        { error: "plan e payment_method são obrigatórios" },
        { status: 400 }
      );
    }

    if (!PLAN_PRICES[body.plan]) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    // 3. Gera idempotency key
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${auth.userId}:${body.plan}:${Date.now()}`)
      .digest("hex");

    // 4. Verifica idempotência
    const { data: idempotencyCheck } = await supabase.rpc("check_idempotency", {
      p_key: idempotencyKey,
      p_user_id: auth.userId,
      p_operation: "subscription",
      p_request_hash: crypto
        .createHash("sha256")
        .update(JSON.stringify(body))
        .digest("hex"),
    });

    if (idempotencyCheck && !idempotencyCheck.allowed) {
      if (idempotencyCheck.status === "duplicate") {
        return NextResponse.json(idempotencyCheck.response);
      }
      return NextResponse.json(
        { error: "Conflito - tente novamente" },
        { status: 409 }
      );
    }

    // 5. Cria assinatura (simulado - integrar com Stripe/Asaas depois)
    const subscription = {
      id: crypto.randomUUID(),
      user_id: auth.userId,
      plan: body.plan,
      status: "active",
      payment_method: body.payment_method,
      price: PLAN_PRICES[body.plan],
      created_at: new Date().toISOString(),
    };

    // 6. Salva no Supabase
    const { error: dbError } = await supabase
      .from("subscriptions")
      .insert({
        id: subscription.id,
        user_id: auth.userId,
        plan: body.plan,
        status: "active",
      });

    if (dbError) {
      console.error("Erro ao salvar assinatura:", dbError);
      return NextResponse.json(
        { error: "Erro ao criar assinatura" },
        { status: 500 }
      );
    }

    // 7. Registra evento (dual-write)
    await supabase.rpc("log_event", {
      p_event_type: "subscription.created",
      p_entity_type: "subscription",
      p_entity_id: subscription.id,
      p_payload: JSON.stringify(subscription),
    });

    // 8. Atualiza plano do usuário
    await supabase
      .from("users")
      .update({ plan: body.plan, updated_at: new Date().toISOString() })
      .eq("id", auth.userId);

    // 9. Marca idempotência como completa
    await supabase
      .from("idempotency_keys")
      .upsert({
        idempotency_key: idempotencyKey,
        user_id: auth.userId,
        operation: "subscription",
        request_hash: crypto
          .createHash("sha256")
          .update(JSON.stringify(body))
          .digest("hex"),
        response: JSON.stringify(subscription),
        status: "completed",
      });

    return NextResponse.json({
      status: "OK",
      subscription,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORISED") {
      return unauthorized();
    }

    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
