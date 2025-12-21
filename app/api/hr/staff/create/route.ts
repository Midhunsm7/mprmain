import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      name,
      phone,
      email,
      department,
      salary,
      joined_at,
      address,
      upi_id,
      account_number,
      ifsc_code,
      bank_name,
      total_salary,
      designation,
      employee_id,
      aadhaar_url,
      pan_url,
      documents
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Check if phone or email already exists
    const { data: existingStaff } = await supabaseServer
      .from("staff")
      .select("id")
      .or(`phone.eq.${phone},email.eq.${email}`)
      .single();

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff with this phone or email already exists" },
        { status: 409 }
      );
    }

    // Generate employee ID if not provided
    const empId = employee_id || `EMP${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabaseServer
      .from("staff")
      .insert([
        {
          id: uuidv4(),
          name,
          phone,
          email: email || null,
          department: department || null,
          salary: salary ? Number(salary) : null,
          total_salary: total_salary ? Number(total_salary) : (salary ? Number(salary) : null),
          joined_at: joined_at || new Date().toISOString().split('T')[0],
          address: address || null,
          upi_id: upi_id || null,
          account_number: account_number || null,
          ifsc_code: ifsc_code || null,
          bank_name: bank_name || null,
          designation: designation || null,
          employee_id: empId,
          aadhaar_url: aadhaar_url || null,
          pan_url: pan_url || null,
          documents: documents || [],
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Staff Create Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create audit log
    await supabaseServer
      .from("audit_log")
      .insert([
        {
          id: uuidv4(),
          action: "staff_created",
          details: {
            staff_id: data.id,
            name: data.name,
            department: data.department
          },
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ 
      success: true, 
      staff: data,
      message: "Staff created successfully"
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}