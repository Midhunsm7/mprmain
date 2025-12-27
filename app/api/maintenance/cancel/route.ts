import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // <-- Changed

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseServer;
    const { request_id } = await req.json();

    if (!request_id) {
      return NextResponse.json(
        { error: "Missing request_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("maintenance_requests")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to cancel request" },
      { status: 500 }
    );
  }
}