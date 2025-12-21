import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateBillNumber } from "@/lib/billNumber";

export async function POST(req: Request) {
  const { order_id, discount = 0, service_charge = 0 } = await req.json();

  const { data: items, error: itemsErr } = await supabaseServer
    .from("kot_items")
    .select("*")
    .eq("order_id", order_id);

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // subtotal
  const subtotal = items.reduce((s, it) => s + Number(it.total), 0);

  // discount
  const discounted = subtotal - Number(discount);

  // service charge
  const withService = discounted + Number(service_charge);

  // GST
  const gstRate = 0.05;
  const gst = withService * gstRate;

  // final total
  const finalTotal = withService + gst;

  // get last bill number
  const { data: lastBill } = await supabaseServer
    .from("kot_bills")
    .select("bill_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const bill_number = generateBillNumber(lastBill?.bill_number ?? null);

  // insert bill
 const { data: bill, error: billErr } = await supabaseServer
  .from("kot_bills")
  .insert({
    order_id,
    subtotal,
    gst,
    total
    // ❌ REMOVE bill_number
  })
  .select("*")
  .single();


  if (billErr) return NextResponse.json({ error: billErr.message }, { status: 500 });

  return NextResponse.json({
    message: "Bill generated",
    bill,
    items,
  });
}
