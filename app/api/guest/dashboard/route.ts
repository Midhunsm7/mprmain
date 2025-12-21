import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json(
        { error: "PIN required" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch guest by PIN
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("*")
      .or(`room_pin.eq.${pin},pin_code.eq.${pin}`)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // 2️⃣ Fetch room-posted restaurant bills
    const { data: kotBills } = await supabaseAdmin
      .from("kot_orders")
      .select("id, total")
      .eq("guest_id", guest.id)
      .eq("billed_to_room", true);

    const restaurantTotal =
      kotBills?.reduce((s, b) => s + Number(b.total || 0), 0) || 0;

    // 3️⃣ Fetch accounts summary
    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("guest_id", guest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      guest,
      restaurantTotal,
      account,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
