import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    

    // Cash from room payments
    const { data: roomCash } = await supabaseServer
      .from("payments")
      .select("amount")
      .eq("method", "cash")
      .eq("status", "completed");

    const cashRooms =
      roomCash?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

    // Cash from KOT
    const { data: kotCash } = await supabaseServer
      .from("kot_bills")
      .select("total")
      .eq("payment_method", "cash")
      .eq("payment_status", "paid");

    const cashKOT =
      kotCash?.reduce((s, k) => s + Number(k.total), 0) ?? 0;

    // Non-cash
    const { data: nonCash } = await supabaseServer
      .from("payments")
      .select("amount")
      .neq("method", "cash")
      .eq("status", "completed");

    const nonCashCollected =
      nonCash?.reduce((s, n) => s + Number(n.amount), 0) ?? 0;

    // Cash spent
    const { data: spent } = await supabaseServer
      .from("expenditures")
      .select("amount")
      .eq("payment_method", "cash");

    const cashSpent =
      spent?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

    return NextResponse.json({
      cashCollected: cashRooms + cashKOT,
      nonCashCollected,
      totalRevenue: cashRooms + cashKOT + nonCashCollected,
      cashInHand: cashRooms + cashKOT - cashSpent,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
