// app/api/kot/assign-room/route.ts - UPDATED VERSION
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

    // 1. First verify the PIN using the guest lookup API
    const lookupRes = await fetch(`${req.nextUrl.origin}/api/guests/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: room_pin }),
    });

    if (!lookupRes.ok) {
      const data = await lookupRes.json();
      return NextResponse.json(
        { error: data.error || "Invalid room PIN" },
        { status: 404 }
      );
    }

    const guestInfo = await lookupRes.json();

    // 2. Get all items from the KOT order
    const { data: orderItems, error: itemsError } = await supabaseServer
      .from("kot_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError) {
      console.error("Failed to fetch order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Order has no items" },
        { status: 400 }
      );
    }

    // 3. Calculate total amount
    const totalAmount = orderItems.reduce(
      (sum, item) => sum + (item.total || item.price * item.quantity),
      0
    );

    // 4. Get the first room ID from guest's room_ids array
    const room_id = guestInfo.room_ids && guestInfo.room_ids.length > 0 
      ? guestInfo.room_ids[0] 
      : null;

    if (!room_id) {
      return NextResponse.json(
        { error: "Guest is not assigned to any room" },
        { status: 400 }
      );
    }

    // 5. Update KOT order to mark as billed to room AND CLOSE IT
    const { error: updateError } = await supabaseServer
      .from("kot_orders")
      .update({
        billed_to_room: true,
        guest_id: guestInfo.id,
        room_id: room_id,
        room_pin: room_pin,
        status: "completed", // Changed from "room_billed" to "completed"
        total: totalAmount,
        table_no: null, // Free the table
        amount: totalAmount
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update KOT order:", updateError);
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
    try {
      const { error: chargeError } = await supabaseServer
        .from("room_charges")
        .insert({
          guest_id: guestInfo.id,
          room_id: room_id,
          category: "restaurant",
          description: `Restaurant Bill - Order #${order_id.slice(0, 8)}`,
          amount: totalAmount,
          reference_id: order_id,
          created_at: new Date().toISOString(),
          created_by: null
        });

      if (chargeError) {
        console.error("Failed to create room charge:", chargeError);
        // Don't fail the whole operation
      }
    } catch (chargeErr) {
      console.error("Room charge creation error:", chargeErr);
      // Continue anyway
    }

    return NextResponse.json({
      success: true,
      message: "Bill successfully assigned to room and order closed",
      guest_name: guestInfo.name,
      room_number: guestInfo.room_number,
      total_amount: totalAmount,
      order_id: order_id,
      table_freed: true,
      status: "completed"
    });

  } catch (error) {
    console.error("Assign room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}