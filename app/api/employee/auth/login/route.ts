import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { updateEmployeeSession } from "@/lib/employee-auth";

export async function POST(req: Request) {
  try {
    const { employee_login_id, employee_pin } = await req.json();

    if (!employee_login_id || !employee_pin) {
      return NextResponse.json(
        { error: "Employee ID and PIN are required" },
        { status: 400 }
      );
    }

    console.log("Login attempt for:", employee_login_id);

    // Find staff by employee_login_id
    const { data: staff, error: findError } = await supabaseServer
      .from("staff")
      .select("*")
      .eq("employee_login_id", employee_login_id.toUpperCase())
      .eq("status", "active")
      .single();

    if (findError || !staff) {
      console.error("Staff not found:", findError?.message);
      return NextResponse.json(
        { error: "Invalid Employee ID or account not active" },
        { status: 401 }
      );
    }

    console.log("Staff found:", staff.name);

    // Check PIN
    const defaultPin = "1234";
    const isDefaultPin = !staff.employee_pin && employee_pin === defaultPin;
    const isValidPin = staff.employee_pin === employee_pin;

    console.log("PIN check:", {
      hasPin: !!staff.employee_pin,
      isDefaultPin,
      isValidPin,
      storedPin: staff.employee_pin,
      providedPin: employee_pin
    });

    if (!isDefaultPin && !isValidPin) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Update last login
    await supabaseServer
      .from("staff")
      .update({ last_login: new Date().toISOString() })
      .eq("id", staff.id);

    // Set first-time PIN if using default
    if (isDefaultPin) {
      console.log("Setting first-time PIN");
      await supabaseServer
        .from("staff")
        .update({ employee_pin: employee_pin })
        .eq("id", staff.id);
    }

    // Create session
    const sessionData = {
      employee_id: staff.id,
      employee_login_id: staff.employee_login_id,
      name: staff.name,
      department: staff.department,
      designation: staff.designation,
      logged_in_at: new Date().toISOString()
    };

    console.log("Creating session:", sessionData);

    // Update session
    await updateEmployeeSession(sessionData);

    console.log("Session updated successfully");

    // Create audit log
    await supabaseServer.from("audit_log").insert({
      action: "EMPLOYEE_LOGIN",
      details: {
        staff_id: staff.id,
        staff_name: staff.name,
        login_id: staff.employee_login_id,
        is_first_login: isDefaultPin
      }
    });

    return NextResponse.json({
      success: true,
      message: isDefaultPin ? "First login successful. Please change your PIN." : "Login successful",
      staff: {
        id: staff.id,
        name: staff.name,
        employee_login_id: staff.employee_login_id,
        department: staff.department,
        designation: staff.designation,
        email: staff.email,
        phone: staff.phone,
        is_first_login: isDefaultPin
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}