import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {

  const { data, error } = await supabaseServer
    .from("expenditures")
    .select("id, description, amount, created_at")
    .eq("source_type", "local_purchase")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
