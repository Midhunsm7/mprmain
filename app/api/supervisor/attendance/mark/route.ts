import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const VALID_STATUSES = ["present", "absent", "half", "leave", "late"];

export async function POST(req: Request) {
  try {
    const { staff_id, status, note } = await req.json();

    if (!staff_id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // 🔐 Ensure supervisor owns this staff
    const { data: mapping } = await supabaseServer
      .from("staff_supervisors")
      .select("staff_id")
      .eq("supervisor_id", user.id)
      .eq("staff_id", staff_id)
      .single();

    if (!mapping) {
      return NextResponse.json(
        { error: "Not allowed to mark attendance for this staff" },
        { status: 403 }
      );
    }

    // 🔁 Prevent duplicate attendance
    const { data: existing } = await supabaseServer
      .from("staff_attendance")
      .select("id")
      .eq("staff_id", staff_id)
      .eq("day", today)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Attendance already marked for today" },
        { status: 400 }
      );
    }

    // ✅ Insert attendance
    const { error } = await supabaseServer
      .from("staff_attendance")
      .insert({
        staff_id,
        day: today,
        status,
        note: note || null,
      });

    if (error) throw error;

    // 🧾 Audit log
    await supabaseServer.from("audit_log").insert({
      staff_id: user.id,
      action: "MARK_ATTENDANCE",
      details: {
        staff_id,
        day: today,
        status,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Attendance mark failed:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
