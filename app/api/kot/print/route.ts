/* File: app/api/kot/print/route.ts
   Enhanced KOT print route with comprehensive details from database
   Includes: guest info, room details, table, NC status, items with pricing
*/

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function escposEncodeText(text: string) {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text + "\n\n\n");
  const cutter = new Uint8Array([0x1d, 0x56, 0x01]);
  const out = new Uint8Array(textBytes.length + cutter.length);
  out.set(textBytes, 0);
  out.set(cutter, textBytes.length);
  return Buffer.from(out).toString("base64");
}

function currency(n: number | null | undefined) {
  if (n == null) return "₹0.00";
  return `₹${n.toFixed(2)}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");
    if (!orderId) return NextResponse.json({ error: "order_id required" }, { status: 400 });

    // Fetch order with all related data
    const { data: orderData, error: orderErr } = await supabaseServer
      .from("kot_orders")
      .select(`
        *,
        guest:guests(name, phone, email, company_name, gstin),
        room:rooms(room_number),
        event:event_bookings(guest_name, event_type)
      `)
      .eq("id", orderId)
      .single();

    if (orderErr || !orderData) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch items with dish details
    const { data: itemsData, error: itemsErr } = await supabaseServer
      .from("kot_items")
      .select(`
        *,
        dish:dishes(name, category)
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsErr) {
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    const items = itemsData || [];
    const isNC = orderData.billing_type === 'nc';
    const isComplimentary = orderData.billing_type === 'complimentary';
    const isStaffMeal = orderData.billing_type === 'staff_meal';
    const isRoomBilled = orderData.billed_to_room || orderData.status === 'room_billed';

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      const itemTotal = item.total || (item.quantity * item.price);
      subtotal += itemTotal;
    });

    const gstRate = 5; // 5% GST for restaurant
    const gstAmount = (subtotal * gstRate) / 100;
    const total = subtotal + gstAmount;

    // Format date and time
    const orderDate = new Date(orderData.created_at);
    const dateStr = orderDate.toLocaleDateString('en-IN');
    const timeStr = orderDate.toLocaleTimeString('en-IN');

    // Determine billing type label
    let billingTypeLabel = '';
    if (isNC) billingTypeLabel = '*** NON-CHARGEABLE (NC) ***';
    else if (isComplimentary) billingTypeLabel = '*** COMPLIMENTARY ***';
    else if (isStaffMeal) billingTypeLabel = '*** STAFF MEAL ***';
    else if (isRoomBilled) billingTypeLabel = '*** BILLED TO ROOM ***';

    // Build HTML
    const headerHTML = `
      <div style="font-family: 'Courier New', monospace; width: 300px; padding: 12px; font-size: 13px;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">MOUNTAINPASS RESIDENCY</h2>
          <div style="font-size: 11px; margin-top: 4px;">Restaurant</div>
          <div style="font-size: 11px;">Amarpatt, Vazhikkadavu, Kattipara</div>
          <div style="font-size: 11px;">Nilambur, Malappuram, Kerala</div>
          <div style="font-size: 11px; margin-top: 2px;">GSTIN: 32AEVPM2212N1ZN</div>
        </div>
        
        ${billingTypeLabel ? `
          <div style="text-align: center; background: #000; color: #fff; padding: 6px; margin: 8px 0; font-weight: bold; font-size: 12px;">
            ${billingTypeLabel}
          </div>
        ` : ''}
        
        <div style="margin: 8px 0; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span><strong>Bill No:</strong></span>
            <span>${orderData.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span><strong>Date:</strong></span>
            <span>${dateStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 3px 0;">
            <span><strong>Time:</strong></span>
            <span>${timeStr}</span>
          </div>
          ${orderData.table_no ? `
            <div style="display: flex; justify-content: space-between; margin: 3px 0;">
              <span><strong>Table:</strong></span>
              <span>${orderData.table_no}</span>
            </div>
          ` : ''}
          ${orderData.order_type ? `
            <div style="display: flex; justify-content: space-between; margin: 3px 0;">
              <span><strong>Order Type:</strong></span>
              <span>${orderData.order_type.toUpperCase().replace('_', ' ')}</span>
            </div>
          ` : ''}
        </div>
        
        ${orderData.guest ? `
          <div style="border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 11px;">
            <div style="margin: 2px 0;"><strong>Guest:</strong> ${orderData.guest.name}</div>
            ${orderData.guest.phone ? `<div style="margin: 2px 0;"><strong>Phone:</strong> ${orderData.guest.phone}</div>` : ''}
            ${orderData.guest.company_name ? `<div style="margin: 2px 0;"><strong>Company:</strong> ${orderData.guest.company_name}</div>` : ''}
            ${orderData.guest.gstin ? `<div style="margin: 2px 0;"><strong>GSTIN:</strong> ${orderData.guest.gstin}</div>` : ''}
          </div>
        ` : ''}
        
        ${orderData.room ? `
          <div style="border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 11px;">
            <div style="margin: 2px 0;"><strong>Room:</strong> ${orderData.room.room_number}</div>
            ${orderData.room_pin ? `<div style="margin: 2px 0;"><strong>PIN:</strong> ${orderData.room_pin}</div>` : ''}
          </div>
        ` : ''}
        
        ${orderData.event ? `
          <div style="border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; font-size: 11px;">
            <div style="margin: 2px 0;"><strong>Event:</strong> ${orderData.event.event_type}</div>
            <div style="margin: 2px 0;"><strong>Guest:</strong> ${orderData.event.guest_name}</div>
          </div>
        ` : ''}
        
        <div style="border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin: 8px 0; font-size: 11px; font-weight: bold;">
          <div style="display: flex; justify-content: space-between;">
            <span style="flex: 2;">ITEM</span>
            <span style="flex: 1; text-align: center;">QTY</span>
            <span style="flex: 1; text-align: right;">RATE</span>
            <span style="flex: 1; text-align: right;">AMOUNT</span>
          </div>
        </div>
    `;

    let itemsHTML = "";
    let textReceipt = "";
    
    items.forEach((item: any) => {
      const itemTotal = item.total || (item.quantity * item.price);
      const itemName = item.item_name || item.dish?.name || 'Unknown Item';
      
      itemsHTML += `
        <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dotted #ccc;">
          <div style="flex: 2;">${itemName}${item.billing_type === 'nc' ? ' [NC]' : ''}</div>
          <div style="flex: 1; text-align: center;">${item.quantity}</div>
          <div style="flex: 1; text-align: right;">${currency(item.price)}</div>
          <div style="flex: 1; text-align: right; font-weight: bold;">${currency(itemTotal)}</div>
        </div>
      `;
      
      textReceipt += `${itemName}${item.billing_type === 'nc' ? ' [NC]' : ''}\n`;
      textReceipt += `  ${item.quantity} x ${currency(item.price)} = ${currency(itemTotal)}\n`;
    });

    const footerHTML = `
        <div style="border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span>Subtotal:</span>
            <span style="font-weight: bold;">${currency(subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 4px 0;">
            <span>GST (${gstRate}%):</span>
            <span style="font-weight: bold;">${currency(gstAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 8px 0; padding-top: 6px; border-top: 2px solid #000; font-size: 14px;">
            <span><strong>TOTAL:</strong></span>
            <span style="font-weight: bold; font-size: 16px;">${currency(total)}</span>
          </div>
          
          ${isNC || isComplimentary || isStaffMeal ? `
            <div style="text-align: center; background: #f0f0f0; padding: 6px; margin: 8px 0; font-size: 11px; border: 1px solid #000;">
              This order is ${isNC ? 'NON-CHARGEABLE' : isComplimentary ? 'COMPLIMENTARY' : 'STAFF MEAL'}<br/>
              No payment required
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; font-size: 10px; margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000;">
          <div style="margin: 4px 0;">Thank you for dining with us!</div>
          <div style="margin: 4px 0;">Visit us again</div>
          <div style="margin: 8px 0; font-size: 9px;">
            Phone: +91 91412 47025<br/>
            Email: mountainpassresidency@gmail.com
          </div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              setTimeout(function() { window.close(); }, 500);
            };
          }, 500);
        };
      </script>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>KOT ${orderData.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 0; }
            }
            body { margin: 0; padding: 0; background: white; }
          </style>
        </head>
        <body>
          ${headerHTML}
          ${itemsHTML}
          ${footerHTML}
        </body>
      </html>
    `;

    // Build ESC/POS text
    let escText = `MOUNTAINPASS RESIDENCY\nRestaurant\nAmarpatt, Vazhikkadavu, Kattipara\nNilambur, Malappuram, Kerala\nGSTIN: 32AEVPM2212N1ZN\n\n`;
    
    if (billingTypeLabel) {
      escText += `${billingTypeLabel}\n\n`;
    }
    
    escText += `Bill No: ${orderData.id.slice(0, 8).toUpperCase()}\n`;
    escText += `Date: ${dateStr}  Time: ${timeStr}\n`;
    if (orderData.table_no) escText += `Table: ${orderData.table_no}\n`;
    if (orderData.order_type) escText += `Type: ${orderData.order_type.toUpperCase()}\n`;
    
    if (orderData.guest) {
      escText += `\nGuest: ${orderData.guest.name}\n`;
      if (orderData.guest.phone) escText += `Phone: ${orderData.guest.phone}\n`;
    }
    
    if (orderData.room) {
      escText += `\nRoom: ${orderData.room.room_number}\n`;
      if (orderData.room_pin) escText += `PIN: ${orderData.room_pin}\n`;
    }
    
    escText += `\n${'='.repeat(40)}\n`;
    escText += textReceipt;
    escText += `${'='.repeat(40)}\n\n`;
    escText += `Subtotal: ${currency(subtotal)}\n`;
    escText += `GST (${gstRate}%): ${currency(gstAmount)}\n`;
    escText += `TOTAL: ${currency(total)}\n\n`;
    
    if (isNC || isComplimentary || isStaffMeal) {
      escText += `${isNC ? 'NON-CHARGEABLE' : isComplimentary ? 'COMPLIMENTARY' : 'STAFF MEAL'}\nNo payment required\n\n`;
    }
    
    escText += `Thank you for dining with us!\nVisit us again\n`;
    escText += `Phone: +91 91412 47025\n`;

    const escpos_base64 = escposEncodeText(escText);

    return NextResponse.json({ html, escpos_base64 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}