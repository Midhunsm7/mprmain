import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_name,
      bill_date,
      due_date,
      amount,
      gst,
      total,
      notes,
    } = body;

    if (!vendor_name || !bill_date || !total) {
      return NextResponse.json(
        { error: "Vendor, bill date and total are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Find or create vendor
    let { data: vendor, error: vendorErr } = await supabaseServer
      .from("vendors")
      .select("id")
      .eq("name", vendor_name)
      .single();

    if (!vendor) {
      const { data: newVendor, error } = await supabaseServer
        .from("vendors")
        .insert({ name: vendor_name })
        .select()
        .single();

      if (error) {
        console.error("VENDOR INSERT ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      vendor = newVendor;
    }

    // 2️⃣ Insert vendor bill
    const { error: billErr } = await supabaseServer
      .from("vendor_bills")
      .insert({
        vendor_id: vendor.id,
        bill_date: bill_date,
        due_date: due_date || null,
        amount: amount || 0,
        gst: gst || 0,
        total: total,
        notes: notes || null,
      });

    if (billErr) {
      console.error("VENDOR BILL INSERT ERROR:", billErr);
      return NextResponse.json(
        { error: billErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("UNEXPECTED ERROR:", e);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
