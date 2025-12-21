import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { vendor_bill_id, remind_at } = await req.json();

  const { error } = await supabaseServer
    .from("vendor_bill_reminders")
    .insert({ vendor_bill_id, remind_at });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
