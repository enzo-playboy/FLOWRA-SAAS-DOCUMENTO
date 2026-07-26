// Rota pra criar assinatura via Stripe Checkout.
// POST /api/subscribe - cria sessão de checkout

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { createCheckoutSession, PLAN_PRICES } from "@/lib/stripe";

// Cliente Supabase com service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SubscribeInput = {
  plan: "start" | "pro" | "agency";
};

export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticação
    const auth = await requireAuth(req);

    // 2. Valida input
    const body: SubscribeInput = await req.json();

    if (!body.plan) {
      return NextResponse.json(
        { error: "plan é obrigatório" },
        { status: 400 }
      );
    }

    if (!PLAN_PRICES[body.plan]) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    // 3. Busca dados do usuário
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", auth.userId)
      .single();

    if (!userData?.email) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // 4. Cria sessão de checkout no Stripe
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession(
      auth.userId,
      userData.email,
      body.plan,
      `${baseUrl}/dashboard?success=true&plan=${body.plan}`,
      `${baseUrl}/dashboard?canceled=true`
    );

    // 5. Retorna URL do checkout
    return NextResponse.json({
      status: "OK",
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORISED") {
      return unauthorized();
    }

    console.error("Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de pagamento" },
      { status: 500 }
    );
  }
}

// GET pra verificar assinatura atual
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("status", "active")
      .single();

    return NextResponse.json({
      status: "OK",
      subscription: subscription || null,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORISED") {
      return unauthorized();
    }

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
