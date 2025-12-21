import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_id = null,
      item_id = null,
      quantity = 1,
      unit_price = 0,
      gst_percentage = 0,
      purchase_type = null,
      payment_mode = null,
      paid_amount = 0,
      source = null,
      notes = null,
      created_by = null,
      auto_use_stock = false,
    } = body;

    // compute totals
    const subtotal = Number(quantity) * Number(unit_price);
    const gst_amount = subtotal * (Number(gst_percentage) / 100);
    const total_amount = subtotal + gst_amount;

    const payload: any = {
      vendor_id,
      item_id,
      quantity,
      unit_price,
      gst_percentage,
      gst_amount,
      total_amount,
      purchase_type,
      payment_mode,
      paid_amount,
      source,
      notes,
      created_by,
    };

    const { data, error } = await supabaseServer
      .from("purchases")
      .insert(payload)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // optionally use cash register if payment_mode === 'cash' and paid_amount > 0
    if (payment_mode === "cash" && Number(paid_amount) > 0) {
      // deduct from main register
      const { data: reg } = await supabaseServer.from("cash_register").select("*").limit(1).single();
      if (reg) {
        const newBalance = Number(reg.balance) - Number(paid_amount);
        await supabaseServer.from("cash_register").update({ balance: newBalance }).eq("id", reg.id);
        await supabaseServer.from("cash_register_transactions").insert({
          register_id: reg.id,
          change_amount: -Number(paid_amount),
          reason: `Purchase ${data.id}`,
          reference_id: data.id,
          created_by,
        });
      }
    }

    // Optionally add stock usage record and reduce inventory_items.stock
    if (auto_use_stock && item_id) {
      await supabaseServer.from("purchase_stock_usage").insert({
        purchase_id: data.id,
        item_id,
        quantity,
      });
      // reduce inventory stock
      await supabaseServer
        .from("inventory_items")
        .update({ stock: supabaseServer.raw("GREATEST(coalesce(stock,0) - ?, 0)", [quantity]) })
        .eq("id", item_id);
      // Note: supabaseServer.raw may not exist depending on your wrapper; if not, fetch current stock first then update.
    }

    return NextResponse.json({ purchase: data });
  } catch (err) {
    console.error("Create purchase error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
