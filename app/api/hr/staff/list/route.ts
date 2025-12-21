import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    
    let query = supabaseServer
      .from("staff")
      .select(`
        id, 
        name, 
        phone, 
        email, 
        department, 
        salary, 
        total_salary,
        joined_at, 
        address, 
        aadhaar_url, 
        pan_url, 
        documents,
        upi_id,
        account_number,
        ifsc_code,
        bank_name,
        employee_id,
        designation,
        status,
        profile_picture,
        created_at
      `)
      .order("created_at", { ascending: false });

    // Apply filters if provided
    if (department && department !== 'all') {
      query = query.eq('department', department);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Staff Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      staff: data,
      count: data?.length || 0
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}