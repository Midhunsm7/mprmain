import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("staff")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}
