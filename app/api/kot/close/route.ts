// app/api/kot/close/route.ts - UPDATED VERSION
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generateBillNumber } from "@/lib/billNumber";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      order_id, 
      gstin = null, 
      is_room_billed = false,
      payment_method = "cash", // Added payment method parameter
      payment_reference = null // Added payment reference for UPI/bank
    } = body;

    if (!order_id)
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

    // Check if order is already billed to room
    const { data: existingOrder, error: orderErr } = await supabaseServer
      .from("kot_orders")
      .select("billed_to_room, status")
      .eq("id", order_id)
      .single();

    if (orderErr)
      return NextResponse.json({ error: orderErr.message }, { status: 500 });

    // If order is already billed to room, just mark as completed
    if (existingOrder.billed_to_room || is_room_billed) {
      const { data, error } = await supabaseServer
        .from("kot_orders")
        .update({
          status: "completed",
          table_no: null,
        })
        .eq("id", order_id)
        .select("*")
        .single();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({
        message: "Room-billed order marked as completed",
        order: data,
      });
    }

    // Original logic for regular orders (not room-billed)
    const { data: items, error: itemsErr } = await supabaseServer
      .from("kot_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsErr)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });

    const subtotal = (items ?? []).reduce(
      (s: number, it: any) =>
        s + Number(it.total ?? it.quantity * it.price),
      0
    );

    // gst rate
    const gstRate = 0.0;
    const gstAmount = Number((subtotal * gstRate).toFixed(2));
    const finalTotal = Number((subtotal + gstAmount).toFixed(2));

    // create kot_bills entry - NOW SETTING payment_status TO 'paid'
    const billNumber = generateBillNumber();

    const { data: bill, error: billErr } = await supabaseServer
      .from("kot_bills")
      .insert({
        order_id,
        bill_number: billNumber,
        subtotal,
        discount: 0,
        service_charge: 0,
        gst: gstAmount,
        total: finalTotal,
        gstin: gstin || null,
        payment_method, // Set payment method
        payment_status: "paid", // CRITICAL: Set to 'paid' when closing
        paid_at: new Date().toISOString(), // Record payment time
        payment_reference // Store UPI/bank reference if provided
      })
      .select("*")
      .single();

    if (billErr)
      return NextResponse.json({ error: billErr.message }, { status: 500 });

    // insert bill items
    for (const it of items ?? []) {
      await supabaseServer.from("kot_bill_items").insert({
        bill_id: bill.id,
        item_name: it.item_name,
        quantity: it.quantity,
        price: it.price,
        total: it.total ?? it.quantity * it.price,
      });
    }

    // mark order closed + free table
    const { data, error } = await supabaseServer
      .from("kot_orders")
      .update({
        status: "closed",
        amount: subtotal,
        gst: gstAmount,
        total: finalTotal,
        table_no: null,
      })
      .eq("id", order_id)
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      message: "Order closed and marked as paid",
      subtotal,
      gstAmount,
      finalTotal,
      bill,
    });
  } catch (err) {
    console.error("Close KOT error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}