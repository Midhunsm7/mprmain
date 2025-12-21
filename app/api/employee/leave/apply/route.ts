import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  let { staff_id, reason, days } = await req.json();

  // TEMP FIX: use a real UUID if front-end sends fake placeholder
  if (!staff_id || staff_id === "test-user-123") {
    staff_id = "3eec5001-9570-4f76-bccf-eb54af4eda90"; // <-- replace with real staff UUID
  }

  // Validate UUID format
  const uuidPattern = /^[0-9a-fA-F-]{36}$/;
  if (!uuidPattern.test(staff_id)) {
    return NextResponse.json(
      { error: "Invalid staff_id format." },
      { status: 400 }
    );
  }

  // Prevent leave more than once per day
  const today = new Date().toISOString().split("T")[0];

  const { data: duplicate } = await supabaseServer
    .from("leave_requests")
    .select("id")
    .eq("staff_id", staff_id)
    .eq("created_at", today);

  if (duplicate && duplicate.length > 0) {
    return NextResponse.json(
      { error: "Leave already submitted today." },
      { status: 400 }
    );
  }

  // Insert new leave
  const { data, error } = await supabaseServer
    .from("leave_requests")
    .insert([{ staff_id, reason, days, status: "Pending" }])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, request: data });
}
