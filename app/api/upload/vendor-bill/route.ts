import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const vendorName = formData.get("vendorName") as string;
    const billDate = formData.get("billDate") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tokenRow } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("provider", "google")
      .single();

    if (!tokenRow?.access_token) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    auth.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date: tokenRow.expiry_date,
    });

    const drive = google.drive({ version: "v3", auth });

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const cleanVendor = vendorName.replace(/\s+/g, "_");
    const ext = file.name.split(".").pop();
    const fileName = `${cleanVendor}_${billDate}.${ext}`;

    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: process.env.GOOGLE_DRIVE_VENDOR_FOLDER_ID
          ? [process.env.GOOGLE_DRIVE_VENDOR_FOLDER_ID]
          : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    const fileId = uploadRes.data.id!;

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    return NextResponse.json({
      success: true,
      url: `https://drive.google.com/file/d/${fileId}/view`,
    });

  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
