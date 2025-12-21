// app/api/kot/assign-room/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const { order_id, room_pin } = await req.json();

    if (!order_id || !room_pin) {
      return NextResponse.json(
        { error: "Order ID and room PIN are required" },
        { status: 400 }
      );
    }

    // 1. Verify the room PIN and get guest/room info
    const { data: guest, error: guestError } = await supabaseServer
      .from("guests")
      .select("id, name, room_ids, room_pin")
      .eq("room_pin", room_pin)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { error: "Invalid room PIN or no guest found" },
        { status: 404 }
      );
    }

    // 2. Get room_id from guest's room_ids array
    const room_id = guest.room_ids?.[0] || null;
    if (!room_id) {
      return NextResponse.json(
        { error: "Guest is not assigned to any room" },
        { status: 400 }
      );
    }

    // 3. Get all items from the KOT order
    const { data: orderItems, error: itemsError } = await supabaseServer
      .from("kot_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError) {
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // 4. Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + (item.total || item.price * item.quantity),
      0
    );

    // 5. Update KOT order to mark as billed to room
    const { error: updateError } = await supabaseServer
      .from("kot_orders")
      .update({
        billed_to_room: true,
        guest_id: guest.id,
        room_id: room_id,
        room_pin: room_pin,
        status: "room_billed" // New status
      })
      .eq("id", order_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update KOT order" },
        { status: 500 }
      );
    }

    // 6. Mark all items as billed to room
    const { error: itemsUpdateError } = await supabaseServer
      .from("kot_items")
      .update({ billed_to_room: true })
      .eq("order_id", order_id);

    if (itemsUpdateError) {
      console.error("Failed to update items:", itemsUpdateError);
    }

    // 7. Create a room charge record directly for guest checkout
    const { error: chargeError } = await supabaseServer
      .from("room_charges")
      .insert({
        guest_id: guest.id,
        room_id: room_id,
        category: "restaurant",
        description: "Restaurant Bill",
        amount: totalAmount,
        reference_id: order_id,
        created_at: new Date().toISOString()
      });

    if (chargeError) {
      console.error("Failed to create room charge:", chargeError);
      // Continue anyway - we can sync later
    }

    return NextResponse.json({
      success: true,
      message: "Bill successfully assigned to room",
      guest_name: guest.name,
      total_amount: totalAmount,
      order_id: order_id
    });

  } catch (error) {
    console.error("Assign room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
