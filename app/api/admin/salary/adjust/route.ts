import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { staff_id, amount, reason, month } = await req.json();

    if (!staff_id || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current staff salary
    const { data: staff, error: fetchError } = await supabaseServer
      .from("staff")
      .select("salary, salary_breakdown")
      .eq("id", staff_id)
      .single();

    if (fetchError) throw fetchError;

    // Create salary adjustment record
    const { error: adjError } = await supabaseServer
      .from("salary_adjustments")
      .insert({
        staff_id,
        month,
        amount,
        reason
      });

    if (adjError) throw adjError;

    // Update staff's total salary (if using running total)
    const currentSalary = staff.salary || 0;
    const newSalary = currentSalary + amount;
    
    const { error: updateError } = await supabaseServer
      .from("staff")
      .update({ 
        salary: newSalary,
        total_salary: newSalary,
        updated_at: new Date().toISOString()
      })
      .eq("id", staff_id);

    if (updateError) throw updateError;

    // Update salary breakdown
    const breakdown = staff.salary_breakdown || {};
    const adjustments = breakdown.adjustments || [];
    
    adjustments.push({
      date: new Date().toISOString(),
      amount,
      reason,
      month
    });

    await supabaseServer
      .from("staff")
      .update({
        salary_breakdown: {
          ...breakdown,
          adjustments,
          last_updated: new Date().toISOString()
        }
      })
      .eq("id", staff_id);

    // Create audit log
    await supabaseServer.from("audit_log").insert({
      action: "SALARY_ADJUSTMENT",
      details: {
        staff_id,
        amount,
        reason,
        month,
        new_salary: newSalary
      }
    });

    return NextResponse.json({ 
      success: true,
      message: "Salary adjusted successfully",
      new_salary: newSalary
    });
  } catch (error: any) {
    console.error("Salary adjustment error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}