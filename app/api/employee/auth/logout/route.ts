import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getEmployeeSession, deleteEmployeeSession } from "@/lib/employee-auth";

export async function POST() {
  try {
    const session = await getEmployeeSession();
    
    if (session) {
      // Create audit log for logout
      await supabaseServer.from("audit_log").insert({
        action: "EMPLOYEE_LOGOUT",
        details: {
          staff_id: session.employee_id,
          staff_name: session.name,
          login_id: session.employee_login_id
        }
      });
    }

    // Clear session cookie
    await deleteEmployeeSession();

    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}