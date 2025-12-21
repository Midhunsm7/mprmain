import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const { task_id, damage_found, damage_notes, damage_amount } = await req.json();

  if (!task_id) {
    return NextResponse.json({ error: "task_id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("housekeeping_tasks")
    .update({
      damage_found,
      damage_notes: damage_found ? damage_notes : null,
      damage_amount: damage_found ? damage_amount : 0,
      status: "cleaning",
      updated_at: new Date(),
    })
    .eq("id", task_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
