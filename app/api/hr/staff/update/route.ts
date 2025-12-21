import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // Check if staff exists
    const { data: existingStaff } = await supabaseServer
      .from("staff")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingStaff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      ...updates
    };

    // Only add updated_at if column exists in the table
    // You can check this by trying to update it and handling potential error
    // For now, we'll omit it since it might not exist
    // updateData.updated_at = new Date().toISOString();

    // Convert salary fields to numbers if present
    if (updates.salary !== undefined) {
      updateData.salary = updates.salary ? Number(updates.salary) : null;
    }
    if (updates.total_salary !== undefined) {
      updateData.total_salary = updates.total_salary ? Number(updates.total_salary) : null;
    }

    const { data, error } = await supabaseServer
      .from("staff")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Staff Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create audit log
    await supabaseServer
      .from("audit_log")
      .insert([
        {
          id: crypto.randomUUID(),
          staff_id: null, // Can be set based on authenticated user
          action: "staff_updated",
          details: {
            staff_id: id,
            updated_fields: Object.keys(updates),
            old_data: existingStaff
          },
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      success: true, 
      staff: data,
      message: "Staff updated successfully"
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}