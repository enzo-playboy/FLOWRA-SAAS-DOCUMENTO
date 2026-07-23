import { NextRequest, NextResponse } from "next/server";
import { MercadoLivreService } from "@/lib/mercadolibre-api";

export async function GET(req: NextRequest) {
  try {
    const mlService = new MercadoLivreService();
    // Busca as tendências de pesquisa reais no Mercado Livre Brasil (MLB)
    const trends = await mlService.getTrendingKeywords();
    
    return NextResponse.json({
      success: true,
      trends: trends
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
