import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { order_id, reason = null } = await req.json();
    if (!order_id) return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

    // mark cancelled and free table
    const { data, error } = await supabaseServer
      .from("kot_orders")
      .update({ status: "cancelled", table_no: null })
      .eq("id", order_id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // optional: insert a ticket into kot_tickets or audit logs
    // await supabaseServer.from("audit_logs").insert({ actor_uuid: null, action: "cancel_kot", details: { order_id, reason } });

    return NextResponse.json({ message: "Order cancelled", order: data });
  } catch (err) {
    console.error("Cancel KOT error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
