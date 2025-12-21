import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("staff")
    .select(`
      id,
      name,
      email,
      department,
      roles:staff_roles(
        roles(name)
      )
    `)
    .order("name");

  if (error) {
    console.error("STAFF LIST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
