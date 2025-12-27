import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const { reason, days, leave_type = "EL" } = await req.json();

    // Validate inputs
    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required." },
        { status: 400 }
      );
    }

    if (!days || days < 1) {
      return NextResponse.json(
        { error: "Invalid number of days." },
        { status: 400 }
      );
    }

    // Check for duplicate leave requests in the last 24 hours
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: duplicate } = await supabaseServer
      .from("leave_requests")
      .select("id")
      .eq("staff_id", session.employee_id)
      .gte("created_at", yesterday.toISOString())
      .lte("created_at", today.toISOString());

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted a leave request in the last 24 hours." },
        { status: 400 }
      );
    }

    // Get current month for tracking
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Insert new leave request
    const { data, error } = await supabaseServer
      .from("leave_requests")
      .insert([{ 
        staff_id: session.employee_id,
        reason: reason.trim(), 
        days, 
        leave_type,
        status: "Pending",
        month_year: currentMonth
      }])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notification for HR
    await supabaseServer
      .from("notifications")
      .insert({
        target_role: "hr",
        title: "New Leave Request",
        message: `${session.name} has submitted a leave request for ${days} days`,
        link: `/hr/leave-requests`,
        status: "unread"
      });

    return NextResponse.json({ 
      success: true, 
      request: data,
      message: "Leave request submitted successfully. Awaiting HR approval."
    });
  } catch (error: any) {
    console.error("Leave application error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}