import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // 🔐 (Optional) role check for HR can be added later

    const { data, error } = await supabaseServer
      .from("leave_requests")
      .select(`
        id,
        staff_id,
        reason,
        days,
        status,
        created_at,
        staff:staff_id (
          name
        )
      `)
      .in("status", ["Pending", "Approved by Supervisor"])
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const formatted = (data ?? []).map((r: any) => ({
      id: r.id,
      staff_id: r.staff_id,
      name: r.staff?.name ?? null,
      reason: r.reason,
      days: r.days,
      status: r.status,
      created_at: r.created_at,
    }));

    return NextResponse.json({ requests: formatted });
  } catch (err: any) {
    console.error("HR leave list failed:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
