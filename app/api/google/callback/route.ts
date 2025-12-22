import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies as nextCookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    /* ===============================
       1️⃣ Validate OAuth state
    =============================== */
    const cookieStore = await nextCookies();
    const storedState = cookieStore.get("google_oauth_state")?.value;

    if (!code || !state || state !== storedState) {
      return NextResponse.redirect(
        `${origin}/login?error=oauth_state_mismatch`
      );
    }

    // Clear state cookie
    cookieStore.set({
      name: "google_oauth_state",
      value: "",
      maxAge: 0,
      path: "/",
    });

    /* ===============================
       2️⃣ Exchange Google code
    =============================== */
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${origin}/login?error=no_access_token`
      );
    }

    /* ===============================
       3️⃣ Service-role Supabase client
    =============================== */
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("UPSERTING GOOGLE TOKENS");

const { error } = await supabase
  .from("google_tokens")
  .upsert(
    {
      provider: "google",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    },
    {
      onConflict: "provider", // 🔑 REQUIRED
    }
  );

if (error) {
  throw error;
}


    /* ===============================
       4️⃣ Redirect back
    =============================== */
    return NextResponse.redirect(`${origin}/accounts/vendors`);

  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(
      `${origin}/login?error=google_auth_failed`
    );
  }
}
