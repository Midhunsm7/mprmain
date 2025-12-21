// app/api/accounts/vendors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorName, description, amount, gst, total, fileUrl } = body;

    if (!vendorName || !amount || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if vendor exists, create if not
    let vendorId;
    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("name", vendorName)
      .single();

    if (existingVendor) {
      vendorId = existingVendor.id;
    } else {
      const { data: newVendor, error: vendorError } = await supabase
        .from("vendors")
        .insert({
          name: vendorName,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (vendorError) throw vendorError;
      vendorId = newVendor.id;
    }

    // Save to vendor_bills table
    const { data, error } = await supabase
      .from("vendor_bills")
      .insert({
        vendor_id: vendorId,
        description,
        amount: parseFloat(amount),
        gst: parseFloat(gst) || 0,
        total: parseFloat(total),
        file_url: fileUrl,
        bill_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        status: "unpaid",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Vendor bill saved successfully",
    });
  } catch (error: any) {
    console.error("Save vendor bill error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save vendor bill" },
      { status: 500 }
    );
  }
}