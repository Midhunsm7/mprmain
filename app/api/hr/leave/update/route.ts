import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { id, status, note } = await req.json();

    if (!id || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("leave_requests")
      .update({
        status,
      })
      .eq("id", id);

    if (error) throw error;

    // Optional audit log
    await supabaseServer.from("audit_log").insert({
      action: "HR_LEAVE_DECISION",
      details: { leave_id: id, status, note },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("HR leave update failed:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
