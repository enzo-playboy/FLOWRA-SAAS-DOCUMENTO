import { NextRequest, NextResponse } from "next/server";
import { TikTokLiveSpyService } from "@/lib/tiktok-live-spy";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get("keyword") || "perfume";

    const spyService = new TikTokLiveSpyService();
    // Puxa as LIVES reais que estão acontecendo no exato momento no TikTok baseadas na palavra-chave
    const liveStreams = await spyService.getRealLiveStreams(keyword);

    return NextResponse.json({
      success: true,
      data: liveStreams
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
