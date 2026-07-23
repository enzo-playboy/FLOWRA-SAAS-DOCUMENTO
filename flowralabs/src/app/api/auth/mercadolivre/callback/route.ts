import { NextRequest, NextResponse } from "next/server";
import { MercadoLivreService } from "@/lib/mercadolibre-api";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization Code do Mercado Livre não fornecido" },
        { status: 400 }
      );
    }

    const mlService = new MercadoLivreService();
    const tokenData = await mlService.getAccessToken(code, req.nextUrl.origin + "/api/auth/mercadolivre/callback");

    return NextResponse.json({
      success: true,
      message: "Conta Mercado Livre conectada com sucesso à Flowra Labs!",
      seller: {
        userId: tokenData.userId,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
