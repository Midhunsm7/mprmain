import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { id, approve } = await req.json();

  const status = approve ? "Admin-Approved" : "Rejected";

  const { error } = await supabaseServer
    .from("leave_requests")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
