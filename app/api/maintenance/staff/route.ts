// ============================================
// app/api/maintenance/staff/route.ts
// ============================================
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <-- Changed

export async function GET() {
  try {
    const supabase = supabaseServer; // <-- Direct assignment

    const { data, error } = await supabase
      .from("staff")
      .select("id, name, department, phone")
      .eq("status", "active")
      .in("department", ["Maintenance", "Housekeeping", "Engineering"])
      .order("name");

    if (error) throw error;

    return NextResponse.json({ staff: data || [] });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}