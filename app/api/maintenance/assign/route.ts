import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <-- Changed

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer;
    const { request_id, staff_id, admin_notes } = await req.json();

    if (!request_id || !staff_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get staff details for notification
    const { data: staffData } = await supabase
      .from("staff")
      .select("name")
      .eq("id", staff_id)
      .single();

    // Update maintenance request
    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        status: "assigned",
        assigned_to: staff_id,
        assigned_at: new Date().toISOString(),
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) throw updateError;

    // Create notification for assigned staff
    const { data: requestData } = await supabase
      .from("maintenance_requests")
      .select("room_number, description")
      .eq("id", request_id)
      .single();

    if (requestData) {
      await supabase.from("notifications").insert({
        target_user: staff_id,
        title: `Maintenance Task Assigned - Room ${requestData.room_number}`,
        message: `You have been assigned a maintenance task: ${requestData.description.substring(0, 100)}`,
        link: `/maintenance/tasks`,
        status: "unread",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to assign request" },
      { status: 500 }
    );
  }
}

