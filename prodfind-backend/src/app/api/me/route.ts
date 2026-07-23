import { NextResponse } from "next/server";

// Placeholder: SuperTokens (Google social) entra na próxima etapa.
// Quando ligado, valida a sessão e retorna o usuário (plan, trial_ends_at).
export async function GET() {
  return NextResponse.json(
    { user: null, message: "auth (SuperTokens) será ligado em seguida" },
    { status: 401 }
  );
}
