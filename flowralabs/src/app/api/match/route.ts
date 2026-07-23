import { NextRequest, NextResponse } from "next/server";
import { ProductMatcherService } from "@/lib/product-matcher";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const title = searchParams.get("title") || "";
    const sku = searchParams.get("sku") || "";
    const image = searchParams.get("image") || "";
    const cost = parseFloat(searchParams.get("cost") || "0");

    if (!title || !cost) {
      return NextResponse.json(
        { success: false, error: "Título e custo do produto são obrigatórios" },
        { status: 400 }
      );
    }

    const matcher = new ProductMatcherService();
    const comparison = await matcher.matchAndCompare(title, sku, image, cost);

    return NextResponse.json({
      success: true,
      comparison: comparison
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
