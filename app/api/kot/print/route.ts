/* File: app/api/kot/print/route.ts
   Server route (GET) that returns printable HTML + ESC/POS base64 for an order.
   Query params: ?order_id=<order-id>
   Response: JSON { html: string, escpos_base64: string }

   Assumptions:
   - supabaseServer exists and is configured.
   - Currency: ₹ (INR). Adjust formatting as needed.
   - ESC/POS payload is basic: text lines + cut. Not using advanced formatting libs.
*/

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function escposEncodeText(text: string) {
  // Very simple ESC/POS encoding:
  // - We'll send plain text + newlines.
  // - Add cutter command (partial cut) at end: GS V 1  (hex: 1D 56 01)
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text + "\n\n\n");
  const cutter = new Uint8Array([0x1d, 0x56, 0x01]);
  const out = new Uint8Array(textBytes.length + cutter.length);
  out.set(textBytes, 0);
  out.set(cutter, textBytes.length);
  // base64 encode
  const base64 = Buffer.from(out).toString("base64");
  return base64;
}

function currency(n: number | null | undefined) {
  if (n == null) return "";
  return `₹${n.toFixed(2)}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");
    if (!orderId) return NextResponse.json({ error: "order_id required" }, { status: 400 });

    // fetch order and items
    const { data: orderData, error: orderErr } = await supabaseServer
      .from("kot_orders")
      .select("*")
      .eq("id", orderId)
      .limit(1)
      .single();
    if (orderErr || !orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: itemsData, error: itemsErr } = await supabaseServer
      .from("kot_items")
      .select("*")
      .eq("order_id", orderId);
    if (itemsErr) {
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    // Build HTML printable slip
    const headerHTML = `
      <div style="font-family: sans-serif; width: 300px; padding: 8px;">
        <h3 style="margin:0; text-align:center;">MountainPass - KOT</h3>
        <div style="text-align:center; font-size:12px; margin-bottom:8px;">Order: ${orderData.id}</div>
        <div style="font-size:12px;">Table/Room: ${orderData.table_or_room ?? "N/A"}</div>
        <div style="font-size:12px;">PIN: ${orderData.assigned_pin ?? "-"}</div>
        <div style="font-size:12px;">Time: ${new Date(orderData.created_at).toLocaleString()}</div>
        <hr />
    `;

    let itemsHTML = "";
    let textReceipt = "";
    let total = 0;
    (itemsData || []).forEach((it: any) => {
      const line = `${it.qty} x ${it.name} ${it.rate ? currency(it.rate) : ""}`;
      itemsHTML += `<div style="display:flex; justify-content:space-between; font-size:13px; padding:3px 0;">
        <div>${it.qty} x ${it.name}</div>
        <div>${it.rate ? currency(it.rate * it.qty) : ""}</div>
      </div>`;
      textReceipt += `${it.qty} x ${it.name} ${it.rate ? " " + currency(it.rate * it.qty) : ""}\n`;
      total += (it.rate || 0) * (it.qty || 0);
    });

    const notesHTML = orderData.notes ? `<div style="font-size:12px; margin-top:6px;"><strong>Notes:</strong> ${orderData.notes}</div>` : "";

    const footerHTML = `
      <hr />
      <div style="display:flex; justify-content:space-between; font-weight:600; font-size:13px;">
        <div>Total</div>
        <div>${currency(total)}</div>
      </div>
      <div style="text-align:center; font-size:11px; margin-top:8px;">
        Thank you! Please collect from kitchen when items are ready.
      </div>
      </div>
      <script>
        // Optional: auto-close after print
        (function(){ 
          setTimeout(()=>{ window.onafterprint = function(){ window.close(); }; }, 1000);
        })();
      </script>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KOT ${orderData.id}</title>
        </head>
        <body>
          ${headerHTML}
          ${itemsHTML}
          ${notesHTML}
          ${footerHTML}
        </body>
      </html>
    `;

    // Build simple ESC/POS text (plain)
    let escText = `MountainPass - KOT\nOrder: ${orderData.id}\nTable/Room: ${orderData.table_or_room ?? "N/A"}\nPIN: ${orderData.assigned_pin ?? "-"}\nTime: ${new Date(orderData.created_at).toLocaleString()}\n\n`;
    escText += textReceipt;
    escText += `\nTOTAL: ${currency(total)}\n\nNotes: ${orderData.notes ?? "-"}\n\n---\n`;

    const escpos_base64 = escposEncodeText(escText);

    return NextResponse.json({ html, escpos_base64 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
