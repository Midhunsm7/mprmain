import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    console.log("[AUDIT API] Called");

    const { data, error } = await supabaseServer
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      console.error("[AUDIT API] Supabase Error:", error);
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 500 }
      );
    }

    console.log("[AUDIT API] Returning", data?.length, "rows");
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[AUDIT API] Exception:", err);
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
