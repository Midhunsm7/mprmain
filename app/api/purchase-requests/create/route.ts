import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { item_id, quantity, reason, description, priority, needed_by } = body;

    if (!item_id || !quantity || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // get user (safe for your project pattern)
    const { data: authData } = await supabaseServer.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { data, error } = await supabaseServer
      .from("purchase_requests")
      .insert({
        item_id,
        quantity: Number(quantity),
        reason,
        description,
        priority,
        needed_by,
        created_by: userId,
        status: "submitted",
        current_stage: "accounts"
      })
      .select("*")
      .single();

    if (error) {
      console.error("CREATE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data }, { status: 201 });
  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
