import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <-- Changed

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer;
    const { request_id, actual_cost, completion_notes } = await req.json();

    if (!request_id) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 }
      );
    }

    // Update maintenance request
    const { error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        status: "completed",
        actual_cost: actual_cost || 0,
        completion_notes: completion_notes || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) throw updateError;

    // Get request details to create expenditure record
    const { data: requestData } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    // Create expenditure record for accounting
    if (requestData && actual_cost > 0) {
      await supabase.from("expenditures").insert({
        source_type: "maintenance",
        category: "Maintenance & Repairs",
        description: `Room ${requestData.room_number} - ${requestData.description}`,
        amount: actual_cost,
        payment_method: "cash",
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    // Notify admin of completion
    await supabase.from("notifications").insert({
      target_role: "admin",
      title: `Maintenance Completed - Room ${requestData?.room_number}`,
      message: `Maintenance work completed. Actual cost: ₹${actual_cost}`,
      link: `/admin/maintenance`,
      status: "unread",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to complete request" },
      { status: 500 }
    );
  }
}
