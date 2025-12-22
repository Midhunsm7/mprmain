import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Staff fetch error:", error);
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Format response data
    const formattedData = {
      ...data,
      // Ensure documents array exists
      documents: data.documents || [],
      // Format dates for display
      joined_at: data.joined_at ? new Date(data.joined_at).toISOString().split('T')[0] : null,
    };

    return NextResponse.json(formattedData);

  } catch (err: any) {
    console.error("Get error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch staff details" },
      { status: 500 }
    );
  }
}