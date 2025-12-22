import { google } from "googleapis";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/login?error=no_code");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  const { tokens } = await oauth2Client.getToken(code);

  // 🔑 IMPORTANT: get user_id explicitly from session cookie
  const supabase = supabaseAdmin;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect("/login?error=not_authenticated");
  }

  await supabase.from("google_tokens").upsert({
    user_id: user.id,           // ✅ MUST NOT BE NULL
    provider: "google",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  });

  return NextResponse.redirect("/accounts/vendors");
}
