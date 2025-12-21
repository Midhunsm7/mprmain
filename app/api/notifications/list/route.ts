import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { role, user_id } = await req.json();

    let q = supabaseServer.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);

    if (role) q = q.eq("target_role", role);
    if (user_id) q = q.eq("target_user", user_id);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("NOTIFICATIONS ERR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
