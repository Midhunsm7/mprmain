import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      amount,
      is_recurring,
      recurring_day,
      received_on,
      payment_method,
    } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Title and amount are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Insert into other_revenue
    const { data: revenue, error } = await supabaseAdmin
      .from("other_revenue")
      .insert({
        title,
        description: description || null,
        amount,
        is_recurring: !!is_recurring,
        recurring_type: is_recurring ? "monthly" : null,
        recurring_day: is_recurring ? recurring_day || 1 : null,
        received_on: received_on || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Insert into accounts (this makes it appear in Revenue page)
    await supabaseAdmin.from("accounts").insert({
      category: "other",
      description: title,
      total_amount: amount,
      payment_method: payment_method || "cash",
    });

    return NextResponse.json({ success: true, revenue });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Failed to add revenue" },
      { status: 500 }
    );
  }
}
