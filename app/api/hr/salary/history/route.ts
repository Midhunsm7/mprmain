import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const limit = searchParams.get('limit') || '10';

    let query = supabaseServer
      .from("salary_adjustments")
      .select(`
        id,
        staff_id,
        month,
        amount,
        reason,
        created_by,
        created_at,
        staff:staff_id(name, department)
      `)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Salary History Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      history: data || [],
      count: data?.length || 0
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}