import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // fetch order
    const { data: order, error: orderErr } = await supabaseServer
      .from("kot_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderErr) {
      return NextResponse.json({ error: orderErr.message }, { status: 500 });
    }

    // fetch items
    const { data: items, error: itemsErr } = await supabaseServer
      .from("kot_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at");

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    return NextResponse.json({
      order,
      items,
    });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
