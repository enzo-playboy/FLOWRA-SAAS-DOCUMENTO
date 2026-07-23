import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { leadSchema } from "@/lib/validate";
import { supabaseAdmin } from "@/lib/supabase";

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  // rate limit por IP (evita bot derrubar o serviço)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await rateLimit(`leads:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "muitas tentativas, tente depois" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "email inválido" }, { status: 400 });
  }

  if (!supabaseAdmin) {
    // DB ainda não configurado: aceita mas não persiste (modo dev)
    return NextResponse.json({ ok: true, dev: true });
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .insert({ email: parsed.data.email, source: parsed.data.source });

  if (error) {
    return NextResponse.json({ error: "falha ao salvar lead" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
