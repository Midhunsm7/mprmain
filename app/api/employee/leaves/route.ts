import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function GET() {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // Get all leaves for current staff
    const { data: leaves, error } = await supabaseServer
      .from("leave_requests")
      .select(`
        id,
        reason,
        days,
        leave_type,
        status,
        lop_days,
        salary_deduction,
        created_at,
        hr_remarks,
        admin_remarks,
        month_year
      `)
      .eq("staff_id", session.employee_id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate EL balance
    const currentMonth = new Date().toISOString().slice(0, 7);
    const approvedELThisMonth = (leaves || []).filter(
      (l: any) => l.status === "Approved" && 
      l.leave_type === "EL" && 
      l.month_year === currentMonth
    ).reduce((sum: number, l: any) => sum + l.days, 0);

    const elLimit = 4; // 1 EL per week
    const availableEL = Math.max(0, elLimit - approvedELThisMonth);

    return NextResponse.json({ 
      leaves: leaves || [],
      stats: {
        el_limit: elLimit,
        el_used: approvedELThisMonth,
        available_el: availableEL,
        total_requests: leaves?.length || 0,
        approved_requests: leaves?.filter((l: any) => l.status === "Approved").length || 0,
        pending_requests: leaves?.filter((l: any) => l.status === "Pending" || l.status === "HR-Approved").length || 0,
        total_lop_deduction: leaves?.filter((l: any) => l.lop_days && l.lop_days > 0)
          .reduce((sum: number, l: any) => sum + (l.salary_deduction || 0), 0) || 0
      }
    });
  } catch (err: any) {
    console.error("Employee leaves failed:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}