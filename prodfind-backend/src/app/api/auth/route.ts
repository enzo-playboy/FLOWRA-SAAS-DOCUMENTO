// Rota pra autenticação via Supabase Auth.
// POST /api/auth - login com email/senha
// GET /api/auth - verificar sessão

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, extractToken, verifyToken } from "@/lib/auth";

// POST: Login com email + magic link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, type } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Magic Link (envia email com link de login)
    if (type === "magiclink" || !type) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        email,
        type: "magiclink",
      });

      if (error) {
        console.error("Erro ao gerar magic link:", error);
        return NextResponse.json(
          { error: "Erro ao enviar link de login" },
        { status: 500 }
        );
      }

      // TODO: Enviar email com o link (usar Resend/SendGrid)
      console.log("Magic link gerado:", data.properties.action_link);

      return NextResponse.json({
        status: "OK",
        message: "Link de login enviado para o email",
        // Em produção, NÃO retorna o link direto
        _dev_link: data.properties.action_link,
      });
    }

    // OTP Code (código de verificação)
    if (type === "otp") {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        email,
        type: "magiclink",
      });

      if (error) {
        return NextResponse.json(
          { error: "Erro ao gerar código" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        status: "OK",
        message: "Código enviado para o email",
      });
    }

    return NextResponse.json(
      { error: "Tipo inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

// GET: Verificar sessão atual
export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("Authorization"));

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    // Busca dados do usuário no banco
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.userId)
      .single();

    return NextResponse.json({
      status: "OK",
      user: {
        id: user.userId,
        email: user.email,
        ...userData,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
