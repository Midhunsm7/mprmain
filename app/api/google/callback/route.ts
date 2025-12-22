import { google } from "googleapis";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    

    // ✅ get logged-in user
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${new URL(req.url).origin}/login`
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      throw new Error("No OAuth code");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token");
    }

    // ✅ store token PER USER
    await supabaseServer.from("google_tokens").upsert({
      user_id: user.id,
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    return NextResponse.redirect(
      `${new URL(req.url).origin}/accounts/vendors`
    );
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      `${new URL(req.url).origin}/login?error=google_auth_failed`
    );
  }
}
