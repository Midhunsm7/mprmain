import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("staff")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Staff update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
