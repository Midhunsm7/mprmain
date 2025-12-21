import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const body = await req.json();

  const {
    guest_id = null,
    room_id = null,
    base_amount = 0,
    extra_hours = 0,
    extra_charge = 0,
    total_amount = 0,
    payment_method = "cash",
    category // <-- may be null or event/room
  } = body;

  // Determine category based on source
  const finalCategory = category
    ? category.toLowerCase()
    : guest_id
    ? "room"
    : "event";

  // Insert into accounts
  const { data, error } = await supabase.from("accounts").insert([
    {
      guest_id,
      room_id,
      base_amount,
      extra_hours,
      extra_charge,
      total_amount,
      category: finalCategory,
      payment_method,
    }
  ]).select("*");

  if (error) {
    console.error("ACCOUNTS INSERT FAILED:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // Log audit entry
  await supabase.from("audit_logs").insert([
    {
      actor_role: "system",
      action: `Created ${finalCategory} transaction`,
      table_name: "accounts",
      record_id: data[0]?.id,
      details: { body },
    }
  ]);

  return NextResponse.json({ success: true, entry: data[0] });
}
