import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { staff_id, status, note, day } = await req.json();

  if (!staff_id || !status)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const today = day || new Date().toISOString().split("T")[0];

  // Check if record exists
  const { data: existing } = await supabaseServer
    .from("staff_attendance")
    .select("*")
    .eq("staff_id", staff_id)
    .eq("day", today)
    .single();

  let result;

  if (existing) {
    // Update
    result = await supabaseServer
      .from("staff_attendance")
      .update({ status, note })
      .eq("id", existing.id);
  } else {
    // Insert new
    result = await supabaseServer.from("staff_attendance").insert({
      staff_id,
      status,
      note,
      day: today,
    });
  }

  if (result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
