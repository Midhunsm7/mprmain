import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { task_id, room_id } = await req.json();

  if (!task_id || !room_id) {
    return NextResponse.json(
      { error: "task_id and room_id required" },
      { status: 400 }
    );
  }

  await supabaseAdmin.from("housekeeping_tasks").update({
    status: "cleaned",
    updated_at: new Date(),
  }).eq("id", task_id);

  await supabaseAdmin.from("rooms").update({
    status: "available",
  }).eq("id", room_id);

  await supabaseAdmin.from("service_records").insert({
    room_id,
    service_type: "housekeeping",
    notes: "Room cleaned",
  });

  return NextResponse.json({ success: true });
}
