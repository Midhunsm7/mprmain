import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { amount, description, category, staffId } =
      await req.json();

    const { data: register } = await supabaseServer
      .from("cash_register")
      .select("id, balance")
      .single();

    if (register.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient cash in hand" },
        { status: 400 }
      );
    }

    // Deduct cash
    await supabaseServer
      .from("cash_register")
      .update({ balance: register.balance - amount })
      .eq("id", register.id);

    // Register transaction
    await supabaseServer
      .from("cash_register_transactions")
      .insert({
        register_id: register.id,
        change_amount: -amount,
        reason: "Local purchase",
        created_by: staffId,
      });

    // Expenditure
    await supabaseServer
      .from("expenditures")
      .insert({
        source_type: "local_purchase",
        category: category ?? "Local Purchase",
        description,
        amount,
        payment_method: "cash",
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
