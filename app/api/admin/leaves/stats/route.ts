import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get all leave requests for current month
    const { data: leaves, error } = await supabaseServer
      .from("leave_requests")
      .select("*")
      .eq("month_year", currentMonth);

    if (error) throw error;

    const stats = {
      total_requests: leaves?.length || 0,
      pending_hr: leaves?.filter(l => l.status === "Pending").length || 0,
      pending_admin: leaves?.filter(l => l.status === "HR-Approved").length || 0,
      approved: leaves?.filter(l => l.status === "Approved").length || 0,
      rejected: leaves?.filter(l => l.status === "Rejected").length || 0,
      total_lop_days: leaves?.reduce((sum, l) => sum + (l.lop_days || 0), 0) || 0,
      total_salary_deduction: leaves?.reduce((sum, l) => sum + (l.salary_deduction || 0), 0) || 0,
      by_department: {} as Record<string, any>,
      by_leave_type: {} as Record<string, number>
    };

    // Calculate by department
    if (leaves) {
      // Get staff details for department breakdown
      const staffIds = leaves.map(l => l.staff_id);
      const { data: staffData } = await supabaseServer
        .from("staff")
        .select("id, department")
        .in("id", staffIds);

      if (staffData) {
        const staffMap = new Map(staffData.map(s => [s.id, s.department]));
        
        leaves.forEach(leave => {
          const dept = staffMap.get(leave.staff_id) || "Unknown";
          if (!stats.by_department[dept]) {
            stats.by_department[dept] = {
              total: 0,
              approved: 0,
              lop_days: 0
            };
          }
          stats.by_department[dept].total++;
          if (leave.status === "Approved") {
            stats.by_department[dept].approved++;
          }
          stats.by_department[dept].lop_days += leave.lop_days || 0;
        });
      }

      // Calculate by leave type
      leaves.forEach(leave => {
        const type = leave.leave_type || "Unknown";
        stats.by_leave_type[type] = (stats.by_leave_type[type] || 0) + 1;
      });
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}