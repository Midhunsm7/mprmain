import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("housekeeping_tasks")
      .select(`
        id,
        status,
        room_id,
        rooms (
          id,
          room_number,
          status,
          floor
        )
      `)
      .neq("status", "cleaned");

    if (error) throw error;

    const rooms = (data ?? []).map((t: any) => {
      // Extract floor from room number (e.g., "301" -> floor 3)
      const roomNumber = t.rooms.room_number;
      const floor = roomNumber ? Math.floor(parseInt(roomNumber) / 100) : 1;

      return {
        task_id: t.id,
        room_id: t.rooms.id,
        room_number: t.rooms.room_number,
        floor: floor,
        status: t.status, // This is the housekeeping status (pending/inspection/cleaning)
      };
    });

    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json(
      { rooms: [], error: err.message },
      { status: 500 }
    );
  }
}