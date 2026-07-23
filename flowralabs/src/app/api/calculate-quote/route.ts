import { NextRequest, NextResponse } from "next/server";
import { CJDropshippingService } from "@/lib/cj-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productPriceUSD, freightPriceUSD, usdToBrlRate, desiredMarginPercent } = body;

    const cjService = new CJDropshippingService();
    const calculation = cjService.calculateUnitEconomics(
      productPriceUSD || 10,
      freightPriceUSD || 5,
      usdToBrlRate || 5.60,
      desiredMarginPercent || 40
    );

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
