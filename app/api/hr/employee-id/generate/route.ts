import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // Get the latest employee ID
    const { data: latestStaff } = await supabaseServer
      .from("staff")
      .select("employee_id")
      .not("employee_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let newId = "EMP0001";
    
    if (latestStaff?.employee_id) {
      const lastNumber = parseInt(latestStaff.employee_id.replace('EMP', ''));
      newId = `EMP${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    return NextResponse.json({ 
      employee_id: newId,
      suggestion: `Suggested ID: ${newId}`
    });
  } catch (err: any) {
    console.error("❌ ID Generation Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}