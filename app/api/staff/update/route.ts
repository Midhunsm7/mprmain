import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staff id" }, { status: 400 });
    }

    // Format date fields properly
    if (updates.joined_at) {
      updates.joined_at = new Date(updates.joined_at).toISOString();
    }

    // Clean empty values
    Object.keys(updates).forEach(key => {
      if (updates[key] === "" || updates[key] === null || updates[key] === undefined) {
        updates[key] = null;
      }
    });

    const { error } = await supabaseAdmin
      .from("staff")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Staff update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the update
    await supabaseAdmin
      .from("audit_log")
      .insert({
        action: "staff_profile_update",
        details: {
          staff_id: id,
          updated_fields: Object.keys(updates),
          update_time: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      message: "Staff details updated successfully",
      updated_fields: Object.keys(updates),
    });

  } catch (err: any) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: err.message || "Update failed" },
      { status: 500 }
    );
  }
}