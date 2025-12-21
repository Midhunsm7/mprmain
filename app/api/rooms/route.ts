import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("rooms")
      .select(`
        id,
        room_number,
        floor,
        status,
        current_guest_id
      `)
      .order("room_number", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      rooms: data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        rooms: [],
        error: err.message,
      },
      { status: 500 }
    );
  }
}
