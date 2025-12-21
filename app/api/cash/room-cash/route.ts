import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { paymentId, amount, staffId } = await req.json();

    const { data: register } = await supabaseServer
      .from("cash_register")
      .select("id, balance")
      .single();

    await supabaseServer
      .from("cash_register")
      .update({ balance: register.balance + amount })
      .eq("id", register.id);

    await supabaseServer
      .from("cash_register_transactions")
      .insert({
        register_id: register.id,
        change_amount: amount,
        reason: "Room payment",
        reference_id: paymentId,
        created_by: staffId,
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
