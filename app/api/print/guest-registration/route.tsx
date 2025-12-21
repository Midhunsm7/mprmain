import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import GuestRegistrationPdf from "@/components/pdf/GuestRegistrationPdf";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const guest_id = searchParams.get("guest_id");
  const room_id = searchParams.get("room_id");
  const reg_no = searchParams.get("reg_no");
  const nationality = searchParams.get("nationality");

  if (!guest_id || !room_id || !reg_no) {
    return new Response("Missing params", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: guest } = await supabase
    .from("guests")
    .select("*")
    .eq("id", guest_id)
    .single();

  const { data: room } = await supabase
    .from("rooms")
    .select("room_number, room_types(name, base_price)")
    .eq("id", room_id)
    .single();

const stream = await renderToStream(
  <GuestRegistrationPdf
    guest={guest}
    room={room}
    regNo={reg_no}
    nationality={nationality}
  />
);

  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=guest-registration.pdf",
    },
  });
}
