import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { bill_id, amount, payment_method, payment_reference } =
      await req.json();

    if (!bill_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment details" },
        { status: 400 }
      );
    }

   

    /* 1️⃣ Fetch bill */
    const { data: bill, error: billErr } = await supabaseServer
      .from("vendor_bills")
      .select("id, total")
      .eq("id", bill_id)
      .single();

    if (billErr || !bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    /* 2️⃣ Total paid so far */
    const { data: payments } = await supabaseServer
      .from("vendor_bill_payments")
      .select("amount")
      .eq("vendor_bill_id", bill_id);

    const alreadyPaid =
      payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;

    const newTotalPaid = alreadyPaid + Number(amount);

    if (newTotalPaid > bill.total) {
      return NextResponse.json(
        { error: "Payment exceeds bill total" },
        { status: 400 }
      );
    }

    /* 3️⃣ Insert payment */
    const { error: payErr } = await supabaseServer
      .from("vendor_bill_payments")
      .insert({
        vendor_bill_id: bill_id,
        amount,
        payment_method,
        payment_reference,
      });

    if (payErr) throw payErr;

    /* 4️⃣ Insert expenditure (THIS IS THE LINK 🔥) */
    const { error: expErr } = await supabaseServer.from("expenditures").insert({
      source_type: "vendor_bill",
      source_id: bill_id,
      category: "Vendor Payment",
      description: "Payment to vendor",
      amount,
      payment_method,
    });

    if (expErr) throw expErr;

    /* 5️⃣ Update bill status */
    let status = "partially_paid";
    let paid_at = null;

    if (newTotalPaid === bill.total) {
      status = "paid";
      paid_at = new Date().toISOString();
    }

    const { error: updErr } = await supabaseServer
      .from("vendor_bills")
      .update({ status, paid_at })
      .eq("id", bill_id);

    if (updErr) throw updErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("VENDOR BILL PAY ERROR", err);
    return NextResponse.json(
      { error: err.message || "Payment failed" },
      { status: 500 }
    );
  }
}
