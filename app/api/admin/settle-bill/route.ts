// app/api/admin/settle-bill/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { billId, mode = "Cash" } = body;
    if (!billId) return NextResponse.json({ error: "billId required" }, { status: 400 });

    const sb = createServerSupabase();

    // Fetch bill
    const { data: billArr, error: fetchErr } = await sb.from("vendor_bills").select("*").eq("id", billId).limit(1);
    if (fetchErr) throw fetchErr;
    const bill = (billArr ?? [])[0];
    if (!bill) return NextResponse.json({ error: "bill not found" }, { status: 404 });

    // Update vendor_bills status
    const { error: updErr } = await sb.from("vendor_bills").update({ status: "Settled" }).eq("id", billId);
    if (updErr) throw updErr;

    // Insert ledger entry (simple)
    const ledgerEntry = {
      date: new Date().toISOString().split("T")[0],
      account: mode === "Cash" ? "Cash" : "Bank",
      type: "Debit",
      amount: bill.amount ?? bill.total ?? 0,
      note: `Settled vendor bill ${billId}`
    };
    const { error: lErr } = await sb.from("ledger").insert(ledgerEntry);
    if (lErr) throw lErr;

    return NextResponse.json({ ok: true });
  } catch (err:any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "unknown" }, { status: 500 });
  }
}
