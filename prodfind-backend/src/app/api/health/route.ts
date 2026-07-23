import { NextResponse } from "next/server";
import { redisReady } from "@/lib/redis";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    redis: redisReady,
    supabase: isSupabaseConfigured,
    time: new Date().toISOString(),
  });
}
