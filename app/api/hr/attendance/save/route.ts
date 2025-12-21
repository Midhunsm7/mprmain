import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { date, records } = await req.json();

  for (const r of records) {
    await supabaseServer
      .from("staff_attendance")
      .upsert(
        { 
          staff_id: r.staff_id, 
          day: date, 
          status: r.status 
        },
        { onConflict: "staff_id,day" }   // 👈 ensures updating instead of duplicating
      );
  }

  return NextResponse.json({ success: true });
}
