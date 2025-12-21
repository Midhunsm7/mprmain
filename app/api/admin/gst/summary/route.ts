import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // Aggregate GST from purchases and payments (example)
    const { data: purchaseGST } = await supabaseServer
      .from("purchases")
      .select("sum(gst_amount) as gst_sum", { count: "exact" });

    const totalGST = (purchaseGST?.[0]?.gst_sum) || 0;
    return NextResponse.json({ totalGST: Number(totalGST) });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
