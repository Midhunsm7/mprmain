import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { staff_id, day, status, note } = await req.json();

  if (!staff_id || !day || !status)
    return NextResponse.json({ error: "missing" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("staff_attendance")
    .insert({ staff_id, day, status, note })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const staff_id = url.searchParams.get("staff_id");
  const month = url.searchParams.get("month"); // YYYY-MM

  if (!staff_id)
    return NextResponse.json({ error: "staff_id required" }, { status: 400 });

  let q = supabaseServer
    .from("staff_attendance")
    .select("*")
    .eq("staff_id", staff_id);

  if (month) {
    const start = `${month}-01`;
    const end = `${month}-31`;
    q = q.gte("day", start).lte("day", end);
  }

  const { data, error } = await q.order("day", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
