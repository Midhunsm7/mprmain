import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { staff_id, month, amount, reason, created_by } = await req.json();

  if (!staff_id || !month || typeof amount !== "number")
    return NextResponse.json({ error: "missing" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("salary_adjustments")
    .insert({ staff_id, month, amount, reason, created_by })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
