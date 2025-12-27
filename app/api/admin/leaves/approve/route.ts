import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { 
      id, 
      status = "Approved",
      leave_type, 
      lop_days = 0, 
      salary_deduction = 0, 
      remarks,
      approved_by 
    } = await req.json();

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the leave request first
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
        status,
        leave_type: leave_type || leaveRequest.leave_type,
        lop_days: lop_days || 0,
        salary_deduction: salary_deduction || 0,
        admin_remarks: remarks,
        admin_approved_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Create audit log
    await supabaseServer.from("audit_log").insert({
      action: "LEAVE_APPROVED",
      details: {
        leave_id: id,
        staff_id: leaveRequest.staff_id,
        status,
        leave_type: leave_type || leaveRequest.leave_type,
        lop_days,
        salary_deduction,
        approved_by: "admin"
      }
    });

    // Send notification to employee
    await supabaseServer.from("notifications").insert({
      target_user: leaveRequest.staff_id,
      title: "Leave Request Approved",
      message: `Your leave request has been ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`,
      link: `/employee/leave`,
      status: "unread"
    });

    return NextResponse.json({ 
      success: true,
      message: "Leave request updated successfully" 
    });
  } catch (error: any) {
    console.error("Leave approval error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}