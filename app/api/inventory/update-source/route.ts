import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { item_id, source, source_type, source_details } = await req.json();
    if (!item_id) return NextResponse.json({ error: "Missing item_id" }, { status: 400 });

    const { data, error } = await supabaseServer
      .from("inventory_items")
      .update({ source, source_type, source_details })
      .eq("id", item_id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
