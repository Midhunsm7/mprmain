import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      phone,
      email,
      gst_number,
      address,
      account_number,
      outstanding_amount,
    } = body;

    // 🔴 Required field check
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("vendors")
      .insert({
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        gst_number: gst_number || null,
        address: address || null,
        account_number: account_number || null,
        outstanding_amount:
          typeof outstanding_amount === "number"
            ? outstanding_amount
            : 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Vendor insert error:", error);
      return NextResponse.json(
        { error: "Failed to create vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, vendor: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("Vendor API error:", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
