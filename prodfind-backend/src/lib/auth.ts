// Configuração de autenticação via Supabase Auth.
// Suporta Google OAuth + Magic Link.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com Service Role (acesso total pro backend)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cliente Supabase pro frontend (com RLS)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Verifica e valida um JWT token do Supabase.
 * Retorna o user_id se válido, null se não.
 */
export async function verifyToken(
  token: string
): Promise<{ userId: string; email?: string } | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai o token do header Authorization.
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Verifica se o usuário está autenticado.
 * Retorna userId se válido, null se não.
 */
export async function verifySession(
  req: NextRequest
): Promise<{ userId: string; email?: string } | null> {
  const token = extractToken(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Middleware que exige autenticação.
 * Lança erro se não estiver autenticado.
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ userId: string; email?: string }> {
  const auth = await verifySession(req);
  if (!auth) {
    throw new Error("UNAUTHORISED");
  }
  return auth;
}

/**
 * Helper pra criar resposta 401.
 */
export function unauthorized(message = "Não autenticado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
