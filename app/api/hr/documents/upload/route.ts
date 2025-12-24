import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  console.log("✅ HR upload route hit");

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const staffId = form.get("staffId") as string | null;
    const type = (form.get("type") as string | null) || "other"; 
    // type: aadhaar | pan | signature | other

    if (!file || !staffId) {
      return NextResponse.json(
        { error: "file and staffId are required" },
        { status: 400 }
      );
    }

    /* ================================
       1️⃣ Read Google tokens from Supabase
    ================================== */
    const { data: tokenRow, error: tokenErr } = await supabaseServer
      .from("google_tokens")
      .select("*")
      .eq("provider", "google")
      .single();

    if (tokenErr || !tokenRow?.access_token) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 401 }
      );
    }

    /* ================================
       2️⃣ Setup Google OAuth
    ================================== */
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

    /* ================================
       3️⃣ Fetch staff record
    ================================== */
    const { data: staff, error: staffErr } = await supabaseServer
      .from("staff")
      .select("id, name, documents, aadhaar_url, pan_url")
      .eq("id", staffId)
      .single();

    if (staffErr || !staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    /* ================================
       4️⃣ Prepare file stream
    ================================== */
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const ext = file.name.split(".").pop() || "bin";
    const cleanName = staff.name.replace(/\s+/g, "_");
    const fileName = `${cleanName}_${type}_${Date.now()}.${ext}`;

    /* ================================
       5️⃣ Upload to Google Drive
    ================================== */
    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: process.env.GOOGLE_DRIVE_HR_FOLDER_ID
          ? [process.env.GOOGLE_DRIVE_HR_FOLDER_ID]
          : undefined,
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    const fileId = uploadRes.data.id!;
    const url = `https://drive.google.com/file/d/${fileId}/view`;

    /* ================================
       6️⃣ Make file publicly readable
    ================================== */
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    /* ================================
       7️⃣ Update staff record
    ================================== */
    let updatePayload: any = {};

    if (type === "aadhaar") {
      updatePayload.aadhaar_url = url;
    } else if (type === "pan") {   
      updatePayload.pan_url = url;
    } else {
      const docs = Array.isArray(staff.documents) ? staff.documents : [];
      updatePayload.documents = [
        ...docs,
        {
          type,
          url,
          uploaded_at: new Date().toISOString(),
        },
      ];
    }

    const { error: updateErr } = await supabaseServer
      .from("staff")
      .update(updatePayload)
      .eq("id", staffId);

    if (updateErr) {
      console.error("HR document update error:", updateErr);
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    /* ================================
       8️⃣ Success response
    ================================== */
    return NextResponse.json({
      success: true,
      url,
    });

  } catch (err) {
    console.error("HR document upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
