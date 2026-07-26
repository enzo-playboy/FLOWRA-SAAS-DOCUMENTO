// Rota pra salvar produto nos favoritos.
// POST /api/favorites

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com service role (acesso total)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type FavoriteInput = {
  product_id: string;
  product_name: string;
  product_price: number;
  product_image: string;
  category_id?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    // 1. Verifica autenticação
    const auth = await requireAuth(req);

    // 2. Valida input
    const body: FavoriteInput = await req.json();

    if (!body.product_id || !body.product_name) {
      return NextResponse.json(
        { error: "product_id e product_name são obrigatórios" },
        { status: 400 }
      );
    }

    // 3. Salva favorito (com proteção contra race condition)
    const { data, error } = await supabase.rpc("add_favorite_safe", {
      p_user_id: auth.userId,
      p_product_id: body.product_id,
      p_product_name: body.product_name,
      p_product_price: body.product_price || 0,
      p_product_image: body.product_image || "",
      p_category_id: body.category_id || null,
    });

    if (error) {
      console.error("Erro ao salvar favorito:", error);
      return NextResponse.json(
        { error: "Erro ao salvar favorito" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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

// DELETE pra remover favorito
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");

    if (!productId) {
      return NextResponse.json(
        { error: "product_id é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", auth.userId)
      .eq("product_id", productId);

    if (error) {
      console.error("Erro ao remover favorito:", error);
      return NextResponse.json(
        { error: "Erro ao remover favorito" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "removed" });
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
