import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { change_amount, reason, created_by } = await req.json();
    if (change_amount === undefined) return NextResponse.json({ error: "Missing amount" }, { status: 400 });

    const { data: reg } = await supabaseServer.from("cash_register").select("*").limit(1).single();
    if (!reg) return NextResponse.json({ error: "No register found" }, { status: 400 });

    const newBalance = Number(reg.balance) + Number(change_amount);
    await supabaseServer.from("cash_register").update({ balance: newBalance }).eq("id", reg.id);

    const { data: trans, error } = await supabaseServer
      .from("cash_register_transactions")
      .insert({ register_id: reg.id, change_amount, reason, created_by })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ transaction: trans, newBalance });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
