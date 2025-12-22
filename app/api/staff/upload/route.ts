import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    /* ===============================
       1️⃣ AUTH CHECK
    =============================== */
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ===============================
       2️⃣ PARSE FORM DATA
    =============================== */
    const formData = await req.formData();
    const staffId = formData.get("staffId") as string;
    const field = formData.get("field") as string;
    const file = formData.get("file") as File;

    if (!staffId || !field || !file) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ===============================
       3️⃣ FETCH STAFF
    =============================== */
    const { data: staff } = await supabaseAdmin
      .from("staff")
      .select("id, name, documents")
      .eq("id", staffId)
      .single();

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    /* ===============================
       4️⃣ GET GOOGLE TOKEN (DB)
    =============================== */
    const { data: tokenRow } = await supabaseAdmin
      .from("google_tokens")
      .select("*")
      .eq("provider", "google")
      .limit(1)
      .single();

    let fileUrl = "";

    try {
      if (!tokenRow?.access_token) {
        throw new Error("Google Drive not connected");
      }

      /* ===============================
         5️⃣ GOOGLE AUTH
      =============================== */
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

      /* ===============================
         6️⃣ FILE PREP
      =============================== */
      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const ext = file.name.split(".").pop() || "jpg";
      const cleanName = staff.name.replace(/\s+/g, "_");
      const fileName = `${cleanName}_${field}_${Date.now()}.${ext}`;

      /* ===============================
         7️⃣ UPLOAD TO DRIVE
      =============================== */
      const uploadRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: process.env.GOOGLE_DRIVE_STAFF_FOLDER_ID
            ? [process.env.GOOGLE_DRIVE_STAFF_FOLDER_ID]
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
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

    } catch (driveErr) {
      /* ===============================
         8️⃣ FALLBACK → SUPABASE STORAGE
      =============================== */
      const ext = file.name.split(".").pop();
      const storagePath = `staff/${staffId}/${field}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("staff-documents")
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return NextResponse.json(
          { error: "Upload failed" },
          { status: 500 }
        );
      }

      const { data } = supabaseAdmin.storage
        .from("staff-documents")
        .getPublicUrl(storagePath);

      fileUrl = data.publicUrl;
    }

    /* ===============================
       9️⃣ UPDATE STAFF TABLE
    =============================== */
    await supabaseAdmin
      .from("staff")
      .update({ [field]: fileUrl })
      .eq("id", staffId);

    /* ===============================
       🔟 UPDATE DOCUMENTS ARRAY
    =============================== */
    if (field.includes("_url")) {
      const filteredDocs =
        (staff.documents || []).filter((d: any) => d.type !== field);

      filteredDocs.push({
        type: field,
        name: field.replace("_url", "").toUpperCase(),
        url: fileUrl,
        uploaded_at: new Date().toISOString(),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      });

      await supabaseAdmin
        .from("staff")
        .update({ documents: filteredDocs })
        .eq("id", staffId);
    }

    /* ===============================
       1️⃣1️⃣ AUDIT LOG
    =============================== */
    await supabaseAdmin.from("audit_log").insert({
      action: "staff_document_upload",
      details: {
        staff_id: staffId,
        field,
        file_name: file.name,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      field,
    });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

/* =====================================
   DELETE ENDPOINT
===================================== */
export async function DELETE(req: NextRequest) {
  try {
    const { staffId, field } = await req.json();

    if (!staffId || !field) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const { data: staff } = await supabaseAdmin
      .from("staff")
      .select("documents")
      .eq("id", staffId)
      .single();

    await supabaseAdmin
      .from("staff")
      .update({ [field]: null })
      .eq("id", staffId);

    if (field.includes("_url") && staff?.documents) {
      const filtered = staff.documents.filter(
        (d: any) => d.type !== field
      );

      await supabaseAdmin
        .from("staff")
        .update({ documents: filtered })
        .eq("id", staffId);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}
