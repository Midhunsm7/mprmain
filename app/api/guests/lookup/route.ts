// app/api/guests/lookup/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Handle both GET and POST
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const phone = searchParams.get("phone");
  const pin = searchParams.get("pin");

  // Determine which lookup to perform
  if (phone) {
    return lookupByPhone(phone);
  } else if (pin) {
    return lookupByPin(pin);
  } else {
    return NextResponse.json(
      { error: "Either phone or PIN parameter is required" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, pin } = body;

    // Determine which lookup to perform
    if (phone) {
      return lookupByPhone(phone);
    } else if (pin) {
      return lookupByPin(pin);
    } else {
      return NextResponse.json(
        { error: "Either phone or PIN is required in request body" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Helper function for phone lookup
async function lookupByPhone(phone: string) {
  try {
    const { data, error } = await supabaseServer
      .from("guests")
      .select("id, name, phone, address, id_proof, status, room_pin")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Phone lookup error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json(data || null);
  } catch (error) {
    console.error("Phone lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function for PIN lookup
async function lookupByPin(pin: string) {
  try {
    // 1. Get guest info
    const { data: guest, error } = await supabaseServer
      .from("guests")
      .select(`
        id,
        name,
        room_pin,
        room_ids,
        status,
        phone,
        email
      `)
      .eq("room_pin", pin)
      .eq("status", "checked-in")
      .single();

    if (error || !guest) {
      return NextResponse.json(
        { error: "No checked-in guest found with this PIN" },
        { status: 404 }
      );
    }

    // 2. Get room details
    let roomNumber = "N/A";
    let roomId: string | null = null;

    if (guest.room_ids?.length) {
      const { data: rooms } = await supabaseServer
        .from("rooms")
        .select("id, room_number")
        .in("id", guest.room_ids)
        .limit(1);

      if (rooms?.length) {
        roomId = rooms[0].id;
        roomNumber = rooms[0].room_number;
      }
    }

    return NextResponse.json({
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      room_pin: guest.room_pin,
      room_id: roomId,
      room_number: roomNumber,
      status: guest.status,
      room_ids: guest.room_ids || [],
    });
  } catch (error) {
    console.error("PIN lookup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}