import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("roles")
    .select("*")
    .order("name");

  if (error) return NextResponse.json([], { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name)
    return NextResponse.json({ error: "Role name required" }, { status: 400 });

  const { error } = await supabaseServer
    .from("roles")
    .insert({ name });

  if (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
