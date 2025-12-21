import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabaseServer
      .from("staff_attendance")
      .select(`
        id,
        staff_id,
        day,
        status,
        note,
        staff:staff_id(name, department)
      `)
      .eq("day", today)
      .order("status", { ascending: true });

    if (error) {
      console.error("❌ Today's Attendance Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      attendance: data || [],
      date: today,
      present: data?.filter(a => a.status === 'present').length || 0,
      absent: data?.filter(a => a.status === 'absent').length || 0,
      total: data?.length || 0
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
} 