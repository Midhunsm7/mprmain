import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = tomorrow.toISOString().split("T")[0];

  const { data: bookings } = await supabaseAdmin
    .from("bookings")
    .select("id, room_id")
    .eq("status", "pending")
    .eq("booking_type", "advance")
    .eq("check_in", dateStr);

  for (const b of bookings || []) {
    await supabaseAdmin
      .from("rooms")
      .update({ status: "reserved" })
      .eq("id", b.room_id);

    await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", b.id);
  }

  return NextResponse.json({ success: true });
}
