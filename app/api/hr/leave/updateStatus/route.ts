import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { id, newStatus } = await req.json();

  // Allowed values:
  // "HR-Approved", "Rejected"
  if (!["HR-Approved", "Rejected"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid state update" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("leave_requests")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
