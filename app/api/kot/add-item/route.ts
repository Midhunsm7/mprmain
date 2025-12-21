// app/api/kot/add-item/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Adds an item to a KOT order.
 * Fetches dish details from database if dish_id is provided.
 *
 * Expects JSON:
 * {
 *   order_id: string,
 *   dish_id?: string, // If provided, fetches dish details
 *   item_name: string,
 *   quantity: number | string,
 *   price?: number | string, // If not provided, calculates from dish
 *   billed_to_room?: boolean
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { order_id, dish_id, item_name } = body;
    let { quantity, price, billed_to_room } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }
    if (!item_name) {
      return NextResponse.json({ error: "Missing item_name" }, { status: 400 });
    }

    // Sanitize quantity
    quantity = Number(quantity ?? 1);
    if (isNaN(quantity) || quantity <= 0) quantity = 1;

    // If dish_id is provided and price is not, fetch dish details
    if (dish_id && (price === undefined || price === null || price === 0)) {
      const { data: dish, error: dishError } = await supabaseServer
        .from("dishes")
        .select("base_price, gst_percentage")
        .eq("id", dish_id)
        .single();

      if (dishError || !dish) {
        console.error("Error fetching dish:", dishError);
        return NextResponse.json(
          { error: "Dish not found or inactive" },
          { status: 404 }
        );
      }

      // Calculate price including GST
      const gstAmount = (dish.base_price * dish.gst_percentage) / 100;
      price = dish.base_price + gstAmount;
    }

    // Ensure price is valid
    price = Number(price ?? 0);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Invalid price. Price must be a positive number." },
        { status: 400 }
      );
    }

    // Build insert payload
    const insertPayload: any = {
      order_id,
      item_name,
      quantity,
      price,
      billed_to_room: billed_to_room === true,
    };

    // Add dish_id if provided
    if (dish_id) {
      insertPayload.dish_id = dish_id;
    }

    const { data, error } = await supabaseServer
      .from("kot_items")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("KOT ITEM INSERT ERROR:", error);
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("KOT add-item server error:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}