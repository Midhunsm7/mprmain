import { google } from "googleapis"
import { NextResponse } from "next/server"
import { Readable } from "stream"
import { supabaseServer } from "@/lib/supabaseServer"

export async function POST(req: Request) {
  try {
    /* 1️⃣ Get logged in user */
    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    /* 2️⃣ Get Google token from DB */
    const { data: tokenRow } = await supabaseServer
      .from("google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!tokenRow?.access_token) {
      return NextResponse.json(
        { error: "Google not connected" },
        { status: 401 }
      )
    }

    /* 3️⃣ Parse form data */
    const data = await req.formData()
    const file = data.get("file") as File
    const rawName = (data.get("vendorName") as string) || "Vendor"
    const billDate =
      (data.get("billDate") as string) ||
      new Date().toISOString().split("T")[0]

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    /* 4️⃣ Prepare filename */
    const cleanVendorName = rawName.replace(/\s+/g, "_")
    const extension = file.name.split(".").pop()
    const customFileName = `${cleanVendorName}_${billDate}.${extension}`

    /* 5️⃣ Google Auth */
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    auth.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    })

    const drive = google.drive({ version: "v3", auth })

    /* 6️⃣ Upload stream */
    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    const response = await drive.files.create({
      requestBody: {
        name: customFileName,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    })

    const fileId = response.data.id
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`

    return NextResponse.json({ url: fileUrl })
  } catch (err) {
    console.error("UPLOAD ERROR:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
