import { google } from "googleapis"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { Readable } from "stream"

export async function POST(req: Request) {
  try {
    const data = await req.formData()

    const file = data.get("file") as File
    const rawName = (data.get("vendorName") as string) || "Vendor"
    const billDate = (data.get("billDate") as string) || new Date().toISOString().split("T")[0]

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // ✅ Clean vendor name and generate custom file name
    const cleanVendorName = rawName.replace(/\s+/g, "_")
    const extension = file.name.split(".").pop()
    const customFileName = `${cleanVendorName}_${billDate}.${extension}`

    // ✅ Read saved token
    const tokenPath = path.join(process.cwd(), "google-token.json")
    if (!fs.existsSync(tokenPath)) {
      return NextResponse.json({ error: "Please login with Google first" }, { status: 401 })
    }

    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"))

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    auth.setCredentials(tokens)

    const drive = google.drive({ version: "v3", auth })

    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    const response = await drive.files.create({
      requestBody: {
        name: customFileName,     // ✅ custom file name here
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    })

    const fileId = response.data.id
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view`

    return NextResponse.json({ url: fileUrl })

  } catch (error) {
    console.error("UPLOAD ERROR:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
