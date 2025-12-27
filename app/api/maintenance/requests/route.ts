// ============================================
// app/api/maintenance/requests/route.ts
// ============================================
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <-- Changed from createClient to supabaseServer

export async function GET() {
  try {
    // No need to call createClient, use supabaseServer directly
    const supabase = supabaseServer;

    const { data, error } = await supabase
      .from("maintenance_requests")
      .select(`
        *,
        assigned_to_staff:assigned_to (
          id,
          name,
          department,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = (data || []).map((req: any) => ({
      ...req,
      assigned_to_name: req.assigned_to_staff?.name || null,
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}