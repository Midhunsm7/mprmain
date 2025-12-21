import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

const getUtcRangeForISTDate = (date: string) => {
  const startIST = new Date(`${date}T00:00:00`)
  const endIST = new Date(`${date}T23:59:59`)
  return {
    startUTC: startIST.toISOString(),
    endUTC: endIST.toISOString(),
  }
}

export async function POST(req: Request) {
  try {
    const { auditDate } = await req.json()
    if (!auditDate) {
      return NextResponse.json({ error: "Missing auditDate" }, { status: 400 })
    }

    // Prevent re-run
    const { data: existing } = await supabase
      .from("night_audits")
      .select("id")
      .eq("audit_date", auditDate)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Night audit already completed for this date" },
        { status: 400 }
      )
    }

    const { startUTC, endUTC } = getUtcRangeForISTDate(auditDate)

    // Revenue
    const { data: accounts } = await supabase
      .from("accounts")
      .select("total_amount")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)

    const totalRoomRevenue = (accounts ?? []).reduce(
      (s, r) => s + Number(r.total_amount || 0),
      0
    )

    // Payments
    const { data: payments } = await supabase
      .from("payments")
      .select("amount, payment_mode")
      .gte("created_at", startUTC)
      .lte("created_at", endUTC)

    let cash = 0,
      bank = 0,
      upi = 0

    payments?.forEach((p) => {
      if (p.payment_mode === "cash") cash += Number(p.amount)
      else if (p.payment_mode === "bank") bank += Number(p.amount)
      else if (p.payment_mode === "upi") upi += Number(p.amount)
    })

    const totalPayments = cash + bank + upi
    const pendingAmount = totalRoomRevenue - totalPayments

    // Occupancy snapshot
    const { data: rooms } = await supabase.from("rooms").select("status")

    const occupiedRooms =
      rooms?.filter((r) => r.status === "occupied").length ?? 0
    const vacantRooms =
      rooms?.filter((r) => r.status === "free").length ?? 0

    // Insert audit
    const { error } = await supabase.from("night_audits").insert({
      audit_date: auditDate,
      total_room_revenue: totalRoomRevenue,
      total_payments: totalPayments,
      pending_amount: pendingAmount,
      cash_total: cash,
      bank_total: bank,
      upi_total: upi,
      occupied_rooms: occupiedRooms,
      vacant_rooms: vacantRooms,
      gst_amount: 0, // add later
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Night audit failed:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
