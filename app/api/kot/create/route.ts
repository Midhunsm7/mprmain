import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { table_no = null, order_type = "dine_in" } = body;

    const { data, error } = await supabaseServer
      .from("kot_orders")
      .insert({
        table_no,
        status: "open",
        order_type,
        amount: 0,
        gst: 0,
        total: 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error("KOT create error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, table_no: data.table_no, created_at: data.created_at, order_type: data.order_type });
  } catch (err) {
    console.error("Create KOT error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
