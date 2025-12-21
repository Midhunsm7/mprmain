import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { purchase_id, amount, payment_mode, upi_reference, bank_txn_id, created_by } = await req.json();

    if (!purchase_id || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // create a Payments record optionally linking to purchase_id
    const { data: payment, error: payErr } = await supabaseServer
      .from("payments")
      .insert({
        booking_id: null,
        amount,
        gst_percentage: 0,
        gst_amount: 0,
        total_amount: amount,
        method: payment_mode,
        payment_mode,
        upi_reference: upi_reference ?? null,
        bank_txn_id: bank_txn_id ?? null,
        cash_register: payment_mode === "cash",
        created_at: new Date(),
      })
      .select("*")
      .single();

    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    // update purchase paid amount and mode
    const { data: purchase, error: pErr } = await supabaseServer
      .from("purchases")
      .update({
        paid_amount: supabaseServer.raw("coalesce(paid_amount,0) + ?", [amount]),
        payment_mode: payment_mode,
      })
      .eq("id", purchase_id)
      .select("*")
      .single();

    // if cash, deduct from register
    if (payment_mode === "cash") {
      const { data: reg } = await supabaseServer.from("cash_register").select("*").limit(1).single();
      if (reg) {
        const newBalance = Number(reg.balance) - Number(amount);
        await supabaseServer.from("cash_register").update({ balance: newBalance }).eq("id", reg.id);
        await supabaseServer.from("cash_register_transactions").insert({
          register_id: reg.id,
          change_amount: -Number(amount),
          reason: `Purchase payment ${purchase_id}`,
          reference_id: payment.id,
          created_by,
        });
      }
    }

    return NextResponse.json({ payment, purchase });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
