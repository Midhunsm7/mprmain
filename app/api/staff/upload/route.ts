// app/api/staff/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ AUTH CHECK
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ PARSE FORM DATA
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

    // 3️⃣ VALIDATE FILE SIZE (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // 4️⃣ VALIDATE FILE TYPE
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const isImage = field === 'profile_picture';
    const allowedTypes = isImage ? allowedImageTypes : [...allowedImageTypes, ...allowedDocumentTypes];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${isImage ? 'images only' : 'images and PDF/DOC'}` },
        { status: 400 }
      );
    }

    // 5️⃣ FETCH STAFF
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("staff")
      .select("id, name, documents")
      .eq("id", staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // 6️⃣ UPLOAD TO SUPABASE STORAGE
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const cleanStaffName = staff.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Create different paths for profile pictures vs documents
    let storagePath: string;
    let fileName: string;
    
    if (field === 'profile_picture') {
      fileName = `profile_${timestamp}.${fileExt}`;
      storagePath = `staff/${staffId}/profile/${fileName}`;
    } else {
      fileName = `${field}_${timestamp}.${fileExt}`;
      storagePath = `staff/${staffId}/documents/${field}/${fileName}`;
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("staff-documents")
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { error: "File upload failed to storage" },
        { status: 500 }
      );
    }

    // 7️⃣ GET PUBLIC URL
    const { data: urlData } = supabaseAdmin.storage
      .from("staff-documents")
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;
    console.log(`Uploaded to Supabase: ${fileUrl}`);

    // 8️⃣ UPDATE STAFF RECORD
    const { error: updateError } = await supabaseAdmin
      .from("staff")
      .update({ 
        [field]: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", staffId);

    if (updateError) {
      console.error("Database update error:", updateError);
      // Try to delete the uploaded file since DB update failed
      await supabaseAdmin.storage
        .from("staff-documents")
        .remove([storagePath]);
      
      return NextResponse.json(
        { error: "Failed to update staff record" },
        { status: 500 }
      );
    }

    // 9️⃣ UPDATE DOCUMENTS ARRAY
    if (field.includes("_url") || field === "profile_picture") {
      const documentName = field === "profile_picture" 
        ? "Profile Picture" 
        : field.replace("_url", "").replace("_", " ").toUpperCase();
      
      const currentDocs = staff.documents || [];
      
      // Remove existing document of same type
      const filteredDocs = currentDocs.filter((doc: any) => 
        doc.type !== field
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
      
      const updatedDocs = [...filteredDocs, newDocument];
      
      await supabaseAdmin
        .from("staff")
        .update({ documents: updatedDocs })
        .eq("id", staffId);
    }

    // 🔟 AUDIT LOG
    await supabaseAdmin.from("audit_log").insert({
      staff_id: user.id,
      action: "staff_document_upload",
      details: {
        target_staff_id: staffId,
        field: field,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      field: field,
      file_name: file.name,
      file_size: file.size,
    });

  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { staffId, field, url } = await req.json();

    if (!staffId || !field) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // 1️⃣ AUTH CHECK
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ FETCH STAFF
    const { data: staff } = await supabaseAdmin
      .from("staff")
      .select("documents")
      .eq("id", staffId)
      .single();

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // 3️⃣ DELETE FROM STORAGE (if it's a Supabase URL)
    if (url && url.includes('supabase.co')) {
      try {
        // Extract file path from URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucket = pathParts[1];
        const filePath = pathParts.slice(2).join('/');
        
        console.log(`Deleting from storage: ${filePath}`);
        
        const { error: storageError } = await supabaseAdmin.storage
          .from(bucket)
          .remove([filePath]);
        
        if (storageError) {
          console.warn("Could not delete from storage:", storageError.message);
        }
      } catch (storageError) {
        console.warn("Error extracting storage path:", storageError);
      }
    }

    // 4️⃣ UPDATE STAFF RECORD
    await supabaseAdmin
      .from("staff")
      .update({ 
        [field]: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", staffId);

    // 5️⃣ UPDATE DOCUMENTS ARRAY
    if (field.includes("_url") && staff?.documents) {
      const filtered = staff.documents.filter(
        (d: any) => d.type !== field
      );

      await supabaseAdmin
        .from("staff")
        .update({ documents: filtered })
        .eq("id", staffId);
    }

    // 6️⃣ AUDIT LOG
    await supabaseAdmin.from("audit_log").insert({
      staff_id: user.id,
      action: "staff_document_delete",
      details: {
        target_staff_id: staffId,
        field: field,
        deleted_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Delete failed" },
      { status: 500 }
    );
  }
}