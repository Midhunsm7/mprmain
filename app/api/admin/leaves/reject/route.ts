import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { id, remarks } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the leave request
    const { data: leaveRequest, error: fetchError } = await supabaseServer
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Update leave request
    const { error: updateError } = await supabaseServer
      .from("leave_requests")
      .update({
        status: "Rejected",
        admin_remarks: remarks,
        admin_approved_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Create audit log
    await supabaseServer.from("audit_log").insert({
      action: "LEAVE_REJECTED",
      details: {
        leave_id: id,
        staff_id: leaveRequest.staff_id,
        status: "Rejected",
        remarks
      }
    });

    // Send notification to employee
    await supabaseServer.from("notifications").insert({
      target_user: leaveRequest.staff_id,
      title: "Leave Request Rejected",
      message: `Your leave request has been rejected.${remarks ? ` Reason: ${remarks}` : ''}`,
      link: `/employee/leave`,
      status: "unread"
    });

    return NextResponse.json({ 
      success: true,
      message: "Leave request rejected" 
    });
  } catch (error: any) {
    console.error("Leave rejection error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}