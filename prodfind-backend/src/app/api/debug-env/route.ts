import { NextResponse } from "next/server";
import { getTrendingByCategory } from "@/lib/ml-highlights";

export async function GET() {
  const r: any = {};
  // warm up DNS with an inline fetch
  try {
    const w = await fetch("https://api.mercadolibre.com/sites/MLB");
    r.warm_status = w.status;
  } catch (e: any) {
    r.warm_err = String(e?.message || e);
  }
  // now call the imported function
  try {
    const items = await getTrendingByCategory("MLB432825", { limit: 3 });
    r.ok = true;
    r.count = items.length;
    r.first = items[0];
  } catch (e: any) {
    r.ok = false;
    r.error = String(e?.message || e);
    r.cause = String(e?.cause?.message || e?.cause || "");
  }
  return NextResponse.json(r);
}
