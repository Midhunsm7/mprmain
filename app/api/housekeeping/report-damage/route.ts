// app/api/housekeeping/report-damage/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const {
      task_id,
      room_id,
      room_number,
      damage_description,
      estimated_cost,
      severity,
      photos,
    } = body;

    if (!task_id || !room_id || !damage_description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update housekeeping task with damage information
    const { error: taskError } = await supabase
      .from("housekeeping_tasks")
      .update({
        status: "cleaning", // Move to cleaning status after damage is reported
        damage_found: true,
        damage_notes: damage_description,
        damage_amount: estimated_cost || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task_id);

    if (taskError) {
      console.error("Error updating housekeeping task:", taskError);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    // Create a maintenance request for admin review
    const { error: maintenanceError } = await supabase
      .from("maintenance_requests")
      .insert({
        room_id: room_id,
        room_number: room_number,
        housekeeping_task_id: task_id,
        issue_type: "damage",
        description: damage_description,
        severity: severity,
        estimated_cost: estimated_cost || 0,
        status: "pending",
        reported_by: null, // You can add staff_id here if you have authentication
        created_at: new Date().toISOString(),
        photos: photos || [],
      });

    if (maintenanceError) {
      console.error("Error creating maintenance request:", maintenanceError);
      // Don't fail the whole operation, just log
    }

    // Create notification for admin
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        target_role: "admin",
        title: `Damage Reported - Room ${room_number}`,
        message: `${severity.toUpperCase()} damage reported during housekeeping inspection: ${damage_description.substring(0, 100)}${damage_description.length > 100 ? "..." : ""}`,
        link: `/admin/maintenance`,
        status: "unread",
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Damage reported successfully",
    });
  } catch (error) {
    console.error("Error in report-damage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}