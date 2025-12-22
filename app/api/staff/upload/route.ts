import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Get staff ID and document type
    const staffId = formData.get("staffId") as string;
    const field = formData.get("field") as string;
    const file = formData.get("file") as File;
    
    if (!staffId || !field || !file) {
      return NextResponse.json(
        { error: "Missing required fields: staffId, field, or file" },
        { status: 400 }
      );
    }

    // Check if staff exists
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff")
      .select("id, name")
      .eq("id", staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    let fileUrl = "";
    
    // Upload to Google Drive
    try {
      const tokenPath = path.join(process.cwd(), "google-token.json");
      if (!fs.existsSync(tokenPath)) {
        return NextResponse.json({ error: "Google login required" }, { status: 401 });
      }

      const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));

      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
      );

      auth.setCredentials(tokens);
      const drive = google.drive({ version: "v3", auth });

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      // Generate filename
      const ext = file.name.split(".").pop() || "jpg";
      const cleanName = (staff.name || "staff").replace(/\s+/g, "_");
      const timestamp = Date.now();
      const fileName = `${cleanName}_${field}_${timestamp}.${ext}`;

      // Create folder path in Google Drive
      const folderName = "Staff_Documents";
      let folderId = process.env.GOOGLE_DRIVE_STAFF_FOLDER_ID;
      
      // Create folder if not exists
      if (!folderId) {
        const folderResponse = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          },
        });
        folderId = folderResponse.data.id;
      }

      // Upload file to Google Drive
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
          description: `Staff document: ${field} for ${staff.name}`,
        },
        media: {
          body: stream,
          mimeType: file.type,
        },
      });

      const fileId = response.data.id;

      // Make the file publicly viewable
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get the public URL
      const fileInfo = await drive.files.get({
        fileId: fileId,
        fields: 'webViewLink, webContentLink',
      });

      fileUrl = fileInfo.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
      
    } catch (uploadErr: any) {
      console.error("Google Drive upload error:", uploadErr);
      
      // Fallback: Try to upload to Supabase Storage
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${staffId}_${field}_${Date.now()}.${fileExt}`;
        const filePath = `staff/${staffId}/${field}/${fileName}`;
        
        const { data, error } = await supabaseAdmin.storage
          .from("staff-documents")
          .upload(filePath, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from("staff-documents")
          .getPublicUrl(filePath);
        
        fileUrl = urlData.publicUrl;
        
      } catch (storageErr: any) {
        console.error("Supabase storage upload error:", storageErr);
        return NextResponse.json(
          { error: "File upload failed to both Google Drive and Supabase Storage" },
          { status: 500 }
        );
      }
    }

    // Update staff record in database
    const { error: updateError } = await supabaseAdmin
      .from("staff")
      .update({ [field]: fileUrl })
      .eq("id", staffId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update staff record" },
        { status: 500 }
      );
    }

    // Add to documents array if it's a document field
    if (field.includes("_url")) {
      const documentName = field.replace("_url", "").replace("_", " ").toUpperCase();
      
      // Get current documents array
      const { data: currentStaff } = await supabaseAdmin
        .from("staff")
        .select("documents")
        .eq("id", staffId)
        .single();
      
      const currentDocuments = currentStaff?.documents || [];
      
      // Remove existing document of same type
      const filteredDocuments = currentDocuments.filter(
        (doc: any) => doc.type !== field
      );
      
      // Add new document
      const newDocument = {
        type: field,
        name: documentName,
        url: fileUrl,
        uploaded_at: new Date().toISOString(),
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      };
      
      await supabaseAdmin
        .from("staff")
        .update({
          documents: [...filteredDocuments, newDocument]
        })
        .eq("id", staffId);
    }

    // Log the upload
    await supabaseAdmin
      .from("audit_log")
      .insert({
        action: "staff_document_upload",
        details: {
          staff_id: staffId,
          staff_name: staff.name,
          document_type: field,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          upload_time: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      field: field,
      message: `Successfully uploaded ${field} document`,
    });

  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint to remove uploaded files
export async function DELETE(req: NextRequest) {
  try {
    const { staffId, field, url } = await req.json();
    
    if (!staffId || !field) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update staff record to remove the URL
    const { error: updateError } = await supabaseAdmin
      .from("staff")
      .update({ [field]: null })
      .eq("id", staffId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update staff record" },
        { status: 500 }
      );
    }

    // Remove from documents array if applicable
    if (field.includes("_url")) {
      const { data: currentStaff } = await supabaseAdmin
        .from("staff")
        .select("documents")
        .eq("id", staffId)
        .single();
      
      if (currentStaff?.documents) {
        const filteredDocuments = currentStaff.documents.filter(
          (doc: any) => doc.type !== field
        );
        
        await supabaseAdmin
          .from("staff")
          .update({ documents: filteredDocuments })
          .eq("id", staffId);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${field} document`,
    });

  } catch (err: any) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}