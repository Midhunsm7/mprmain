import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, status, comment, staff_id, days } = body;

  let update: any = {
    admin_comment: comment,
  };

  if (status === "approve") {
    update.stage = "Approved";

    // auto insert in attendance table
    const leaveDays = Number(days);
    for (let i = 0; i < leaveDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      await supabaseServer.from("staff_attendance").insert({
        staff_id,
        day: date.toISOString().split("T")[0],
        status: "leave"
      });
    }
  }

  if (status === "reject") update.stage = "Rejected-Admin";

  const { error } = await supabaseServer
    .from("leave_requests")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
