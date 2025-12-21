import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const employeeName = (form.get("employeeName") as string) || "employee";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const tokenPath = path.join(process.cwd(), "google-token.json");
    if (!fs.existsSync(tokenPath)) {
      return NextResponse.json({ error: "Google login required" }, { status: 401 });
    }

    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials(tokens);
    const drive = google.drive({ version: "v3", auth });

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const ext = file.name.split(".").pop();
    const cleanName = employeeName.replace(/\s+/g, "_");
    const fileName = `${cleanName}_${Date.now()}.${ext}`;

    const response = await drive.files.create({
      requestBody: { name: fileName },
      media: { body: stream, mimeType: file.type },
    });

    const fileId = response.data.id;
    const url = `https://drive.google.com/file/d/${fileId}/view`;

    return NextResponse.json({ url });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
