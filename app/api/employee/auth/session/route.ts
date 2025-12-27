import { NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee-auth";

export async function GET() {
  try {
    const session = await getEmployeeSession();
    
    console.log("Session API called, session exists:", !!session);
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated", session: null },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      session,
      message: "Session valid" 
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: error.message, session: null },
      { status: 500 }
    );
  }
}