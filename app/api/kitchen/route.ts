import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const date =
      searchParams.get("date") ||
      new Date().toISOString().split("T")[0]

    // Fetch kitchen dashboard data
    const [reports, requests, nightReports] = await Promise.all([
      supabase
        .from("kitchen_daily_report")
        .select("*")
        .eq("date", date)
        .order("created_at", { ascending: false }),

      supabase
        .from("kitchen_inventory_request")
        .select(`
          id,
          item_id,
          quantity,
          priority,
          status,
          reason,
          created_at,
          inventory_items(name, unit)
        `)
        .order("created_at", { ascending: false })
        .limit(20),

      supabase
        .from("kitchen_night_report")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(10),
    ])

    if (reports.error) throw reports.error
    if (requests.error) throw requests.error
    if (nightReports.error) throw nightReports.error

    // Normalize inventory requests
    const normalizedRequests =
      requests.data?.map((r: any) => ({
        id: r.id,
        item_id: r.item_id,
        item_name: r.inventory_items?.name ?? "Unknown",
        unit: r.inventory_items?.unit ?? "",
        quantity: r.quantity,
        priority: r.priority,
        status: r.status,
        reason: r.reason,
        created_at: r.created_at,
      })) ?? []

    return NextResponse.json({
      reports: reports.data ?? [],
      requests: normalizedRequests,
      nightReports: nightReports.data ?? [],
    })
  } catch (error) {
    console.error("Kitchen API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch kitchen data" },
      { status: 500 }
    )
  }
}
