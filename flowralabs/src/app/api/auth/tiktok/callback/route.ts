import { NextRequest, NextResponse } from "next/server";
import { TikTokShopService } from "@/lib/tiktok-api";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Authorization Code não fornecido" },
        { status: 400 }
      );
    }

    const tiktokService = new TikTokShopService();
    const tokenData = await tiktokService.getAccessToken(code, req.nextUrl.origin + "/api/auth/tiktok/callback");

    // Retorna os dados do token (em produção, salvamos no NeonDB vinculando ao user_id)
    return NextResponse.json({
      success: true,
      message: "Conta TikTok Shop conectada com sucesso à Flowra Labs!",
      seller: {
        sellerId: tokenData.sellerId,
        sellerName: tokenData.sellerName,
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
