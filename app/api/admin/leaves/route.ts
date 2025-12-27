import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // Get all leave requests with staff details
    const { data: leaveRequests, error } = await supabaseServer
      .from("leave_requests")
      .select(`
        *,
        staff:staff_id (
          name,
          department,
          designation,
          salary,
          employee_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const stats = await calculateLeaveStats();

    return NextResponse.json({ 
      requests: leaveRequests || [],
      stats 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function calculateLeaveStats() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Get current month's data
  const { data: currentMonthLeaves } = await supabaseServer
    .from("leave_requests")
    .select("*")
    .eq("month_year", currentMonth);

  const stats = {
    total_requests: 0,
    pending_hr: 0,
    pending_admin: 0,
    approved: 0,
    rejected: 0,
    total_lop_days: 0,
    total_salary_deduction: 0,
    monthly_summary: [] as Array<{
      month: string;
      total_leaves: number;
      lop_days: number;
      salary_deduction: number;
    }>
  };

  if (currentMonthLeaves) {
    stats.total_requests = currentMonthLeaves.length;
    stats.pending_hr = currentMonthLeaves.filter(l => l.status === "Pending").length;
    stats.pending_admin = currentMonthLeaves.filter(l => l.status === "HR-Approved").length;
    stats.approved = currentMonthLeaves.filter(l => l.status === "Approved").length;
    stats.rejected = currentMonthLeaves.filter(l => l.status === "Rejected").length;
    stats.total_lop_days = currentMonthLeaves.reduce((sum, l) => sum + (l.lop_days || 0), 0);
    stats.total_salary_deduction = currentMonthLeaves.reduce((sum, l) => sum + (l.salary_deduction || 0), 0);
  }

  // Get monthly summary for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startMonth = sixMonthsAgo.toISOString().slice(0, 7);

  const { data: monthlyData } = await supabaseServer
    .from("leave_requests")
    .select("*")
    .gte("month_year", startMonth);

  if (monthlyData) {
    const monthlyMap = new Map();
    
    monthlyData.forEach(leave => {
      if (!monthlyMap.has(leave.month_year)) {
        monthlyMap.set(leave.month_year, {
          total_leaves: 0,
          lop_days: 0,
          salary_deduction: 0
        });
      }
      
      const monthData = monthlyMap.get(leave.month_year);
      monthData.total_leaves++;
      monthData.lop_days += leave.lop_days || 0;
      monthData.salary_deduction += leave.salary_deduction || 0;
    });

    stats.monthly_summary = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  return stats;
}