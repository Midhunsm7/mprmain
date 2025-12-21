import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("staff")
    .select("*")
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("HR staff list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data ?? [] });
}
