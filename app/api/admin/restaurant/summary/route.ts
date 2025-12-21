import { supabaseServer } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all closed orders for today
    const { data: orders, error } = await supabaseServer
      .from("kot_orders")
      .select("id, total, gst, amount, created_at, status")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let todayRevenue = 0;
    let gst = 0;
    let closedOrders = 0;
    let openOrders = 0;

    orders.forEach((o) => {
      if (o.status === "closed") {
        todayRevenue += Number(o.total || 0);
        gst += Number(o.gst || 0);
        closedOrders++;
      } else {
        openOrders++;
      }
    });

    return NextResponse.json({
      todayRevenue,
      gst,
      closedOrders,
      openOrders,
      orders,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
