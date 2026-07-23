import { NextRequest, NextResponse } from "next/server";
import { generateAIListing } from "@/lib/ai-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalTitle, category, targetMarketplace, landedCostBRL, suggestedSellPriceBRL } = body;

    if (!originalTitle) {
      return NextResponse.json(
        { success: false, error: "Título do produto é obrigatório" },
        { status: 400 }
      );
    }

    const aiListing = await generateAIListing({
      originalTitle,
      category: category || "Geral",
      targetMarketplace: targetMarketplace || "mercadolivre",
      landedCostBRL: landedCostBRL || 100,
      suggestedSellPriceBRL: suggestedSellPriceBRL || 199.90,
    });

    return NextResponse.json({
      success: true,
      data: aiListing,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
