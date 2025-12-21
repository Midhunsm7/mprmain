
import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    const staffId = form.get("staffId") as string | null;
    const type = (form.get("type") as string | null) || "other"; // aadhaar | pan | signature | other

    if (!file || !staffId) {
      return NextResponse.json({ error: "file and staffId are required" }, { status: 400 });
    }

    // read Google tokens
    const tokenPath = path.join(process.cwd(), "google-token.json");
    if (!fs.existsSync(tokenPath)) {
      return NextResponse.json({ error: "Please login with Google first" }, { status: 401 });
    }

    const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth });

    const { data: staff, error: staffErr } = await supabaseServer
      .from("staff")
      .select("id, name, documents, aadhaar_url, pan_url")
      .eq("id", staffId)
      .single();

    if (staffErr || !staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const ext = file.name.split(".").pop() || "bin";
    const cleanName = staff.name.replace(/\s+/g, "_");
    const fileName = `${cleanName}_${type}_${Date.now()}.${ext}`;

    const uploadRes = await drive.files.create({
      requestBody: { name: fileName },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    const fileId = uploadRes.data.id;
    const url = `https://drive.google.com/file/d/1ofnIaqFyhCE96zZ4Ohd58jDhxp9m2oUg/view`;

    // update DB
    let updatePayload: any = {};
    if (type === "aadhaar") {
      updatePayload.aadhaar_url = url;
    } else if (type === "pan") {
      updatePayload.pan_url = url;
    } else {
      const docs = (staff.documents as any) || [];
      updatePayload.documents = [...docs, { type, url, uploaded_at: new Date().toISOString() }];
    }

    const { error: updateErr } = await supabaseServer
      .from("staff")
      .update(updatePayload)
      .eq("id", staffId);

    if (updateErr) {
      console.error("HR document update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("HR document upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
