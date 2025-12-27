import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { id, status = "HR-Approved", remarks } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update leave request
    const { error: updateError } = await supabaseServer
      .from("leave_requests")
      .update({
        status,
        hr_remarks: remarks,
        hr_approved_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Create audit log
    await supabaseServer.from("audit_log").insert({
      action: "LEAVE_HR_APPROVED",
      details: {
        leave_id: id,
        status,
        remarks
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Leave request forwarded to admin" 
    });
  } catch (error: any) {
    console.error("HR leave approval error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}