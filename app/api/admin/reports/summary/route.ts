import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data: purchaseTotals } = await supabaseServer
      .from("purchases")
      .select("sum(total_amount) as total_sum, count(id) as count", { head: false });

    const { data: paymentsTotals } = await supabaseServer
      .from("payments")
      .select("sum(amount) as paid_sum, count(id) as count", { head: false });

    return NextResponse.json({
      purchases: purchaseTotals?.[0] ?? { total_sum: 0, count: 0 },
      payments: paymentsTotals?.[0] ?? { paid_sum: 0, count: 0 },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
