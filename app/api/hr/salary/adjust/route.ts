import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staff_id, amount, reason, created_by } = body;

    if (!staff_id || amount == null) {
      return NextResponse.json(
        { error: "staff_id and amount are required" },
        { status: 400 }
      );
    }

    // Insert into salary_adjustments
    const { error: adjError } = await supabaseServer
      .from("salary_adjustments")
      .insert({
        staff_id,
        amount,
        reason: reason || null,
        created_by: created_by || null,
        month: new Date().toISOString().slice(0, 7), // "YYYY-MM"
      });

    if (adjError) {
      console.error("HR salary adjustment insert error:", adjError);
      return NextResponse.json({ error: adjError.message }, { status: 500 });
    }

    // Update the staff table salary
    const { error: staffError } = await supabaseServer
      .from("staff")
      .update({ salary: amount })
      .eq("id", staff_id);

    if (staffError) {
      console.error("HR salary staff update error:", staffError);
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("HR salary adjustment exception:", err);
    return NextResponse.json({ error: "Failed to adjust salary" }, { status: 500 });
  }
}
