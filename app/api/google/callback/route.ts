import { google } from "googleapis"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "No code found" })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  // Save token locally (SAFE - not public)
  const TOKEN_PATH = path.join(process.cwd(), "google-token.json")
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))

  return NextResponse.redirect("http://localhost:3000/accounts/vendors")
}
