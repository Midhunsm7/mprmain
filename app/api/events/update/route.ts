import { supabaseServer } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();
  const { id, bill_amount, extra_charge, payment_method } = payload;

  // Update event booking
  await supabaseServer.from("event_bookings")
    .update({
      end_time: new Date().toISOString(),
      bill_amount,
      extra_charge,
      payment_method,
      status: "completed",
    })
    .eq("id", id);

  // Save to accounts table
  await supabaseServer.from("accounts").insert({
    guest_id: null,
    room_id: null,
    base_amount: bill_amount,
    extra_hours: null,
    extra_charge,
    total_amount: bill_amount + extra_charge,
    payment_method,
    category: "event",
  });

  return NextResponse.json({ success: true });
}
