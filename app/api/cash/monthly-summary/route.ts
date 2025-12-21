import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month"); // YYYY-MM
    if (!month) {
      return NextResponse.json(
        { error: "Month is required (YYYY-MM)" },
        { status: 400 }
      );
    }

    // ✅ Proper ISO date range
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    /* ---------------- Cash from room payments ---------------- */
    const { data: roomCash, error: roomErr } = await supabaseServer
      .from("payments")
      .select("amount")
      .eq("method", "cash")
      .eq("status", "completed")
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (roomErr) throw roomErr;

    const cashRooms =
      roomCash?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;

    /* ---------------- Cash from KOT ---------------- */
    const { data: kotCash, error: kotErr } = await supabaseServer
      .from("kot_bills")
      .select("total")
      .eq("payment_method", "cash")
      .eq("payment_status", "paid")
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (kotErr) throw kotErr;

    const cashKOT =
      kotCash?.reduce((s, k) => s + Number(k.total), 0) ?? 0;

    /* ---------------- Non-cash ---------------- */
    const { data: nonCash, error: nonCashErr } = await supabaseServer
      .from("payments")
      .select("amount")
      .neq("method", "cash")
      .eq("status", "completed")
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (nonCashErr) throw nonCashErr;

    const nonCashCollected =
      nonCash?.reduce((s, n) => s + Number(n.amount), 0) ?? 0;

    /* ---------------- Cash spent ---------------- */
    const { data: spent, error: spentErr } = await supabaseServer
      .from("expenditures")
      .select("amount")
      .eq("payment_method", "cash")
      .gte("created_at", startISO)
      .lt("created_at", endISO);

    if (spentErr) throw spentErr;

    const cashSpent =
      spent?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;

    return NextResponse.json({
      month,
      cashCollected: cashRooms + cashKOT,
      nonCashCollected,
      cashSpent,
      netCash: cashRooms + cashKOT - cashSpent,
    });
  } catch (e: any) {
    console.error("Monthly summary error:", e);
    return NextResponse.json(
      { error: e.message ?? "Monthly summary failed" },
      { status: 500 }
    );
  }
}
