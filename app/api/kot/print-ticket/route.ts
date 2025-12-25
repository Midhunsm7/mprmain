import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // First, get the order details
    const { data: order, error: orderError } = await supabaseServer
      .from("kot_orders")
      .select("table_no, room_pin, billing_type, created_at")
      .eq("id", order_id)
      .single();

    if (orderError) {
      console.error("Order fetch error:", orderError);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get items for the order
    const { data: items, error: itemsErr } = await supabaseServer
      .from("kot_items")
      .select("item_name, quantity, price, total")
      .eq("order_id", order_id);

    if (itemsErr) {
      console.error("Items fetch error:", itemsErr);
      return NextResponse.json({ error: itemsErr.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items found for order" }, { status: 400 });
    }

    // Get last ticket number for this order
    const { data: lastTickets, error: ticketError } = await supabaseServer
      .from("kot_tickets")
      .select("ticket_no")
      .eq("order_id", order_id)
      .order("ticket_no", { ascending: false })
      .limit(1);

    if (ticketError) {
      console.error("Ticket fetch error:", ticketError);
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    const ticket_no = lastTickets && lastTickets.length > 0 
      ? lastTickets[0].ticket_no + 1 
      : 1;

    // Calculate total
    const total = items.reduce((sum, item) => {
      return sum + (item.total || (item.quantity * item.price) || 0);
    }, 0);

    // Prepare items for storage (simplified)
    const simplifiedItems = items.map(item => ({
      item_name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      total: item.total || item.quantity * item.price
    }));

    // Insert ticket snapshot (without printed_at column)
    const { error: insertErr } = await supabaseServer
      .from("kot_tickets")
      .insert({
        order_id,
        ticket_no,
        items: simplifiedItems
      });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Generate a nicely formatted HTML for printing
    const html = generatePrintHTML({
      orderId: order_id,
      ticketNo: ticket_no,
      items,
      total,
      tableNo: order.table_no,
      roomPin: order.room_pin,
      billingType: order.billing_type,
      createdAt: order.created_at,
      printedAt: new Date(),
    });

    return NextResponse.json({
      message: "KOT Ticket created successfully",
      ticket_no,
      total_items: items.length,
      total_amount: total,
      html,
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generatePrintHTML(data: {
  orderId: string;
  ticketNo: number;
  items: Array<{ item_name: string; quantity: number; price: number; total?: number }>;
  total: number;
  tableNo?: string | null;
  roomPin?: string | null;
  billingType?: string | null;
  createdAt: string;
  printedAt: Date;
}) {
  const shortId = data.orderId.slice(0, 8).toUpperCase();
  const isNc = data.billingType === 'nc';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KOT Ticket #${data.ticketNo}</title>
    <style>
        @media print {
            @page {
                margin: 0.5cm;
                size: 80mm 200mm;
            }
            body {
                margin: 0;
                padding: 10px;
                width: 80mm;
                font-size: 10pt;
                line-height: 1.2;
            }
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Courier New', monospace;
        }
        body {
            width: 80mm;
            padding: 10px;
            font-size: 10pt;
            line-height: 1.2;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px dashed #000;
        }
        .restaurant-name {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3px;
        }
        .restaurant-tagline {
            font-size: 8pt;
            margin-bottom: 5px;
        }
        .ticket-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 9pt;
        }
        .order-type {
            text-align: center;
            padding: 3px 10px;
            margin: 5px 0;
            background: ${isNc ? '#FFEAA7' : '#e3f2fd'};
            border-radius: 3px;
            font-weight: bold;
            font-size: 9pt;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .items-table th {
            text-align: left;
            padding: 4px 0;
            border-bottom: 1px solid #ddd;
            font-size: 9pt;
        }
        .items-table td {
            padding: 4px 0;
            border-bottom: 1px dashed #eee;
            vertical-align: top;
        }
        .item-qty {
            text-align: center;
            width: 15%;
        }
        .item-name {
            width: 55%;
        }
        .item-price {
            text-align: right;
            width: 30%;
        }
        .total-row {
            font-weight: bold;
            border-top: 2px solid #000;
            margin-top: 10px;
            padding-top: 8px;
        }
        .total-row td {
            border: none;
            padding-top: 8px;
        }
        .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 1px dashed #ddd;
            padding-top: 8px;
        }
        .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 39', monospace;
            font-size: 16pt;
            letter-spacing: 2px;
        }
        .nc-badge {
            background: #FF6B6B;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8pt;
            font-weight: bold;
        }
        .room-badge {
            background: #9C27B0;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8pt;
            font-weight: bold;
        }
        .print-time {
            font-size: 8pt;
            color: #666;
            text-align: center;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="restaurant-name">RESTAURANT NAME</div>
        <div class="restaurant-tagline">Food & Beverage</div>
    </div>

    <div class="ticket-info">
        <div>
            <strong>KOT #${data.ticketNo}</strong><br>
            Order: ${shortId}<br>
            ${data.tableNo ? `Table: ${data.tableNo}` : 'Takeaway'}
        </div>
        <div style="text-align: right;">
            ${new Date(data.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}<br>
            ${new Date(data.createdAt).toLocaleDateString()}
        </div>
    </div>

    ${data.roomPin ? `
    <div class="order-type">
        Room: ${data.roomPin}
    </div>
    ` : ''}

    ${isNc ? `
    <div class="order-type">
        <div class="nc-badge">NON-CHARGEABLE ORDER</div>
    </div>
    ` : ''}

    <table class="items-table">
        <thead>
            <tr>
                <th class="item-qty">Qty</th>
                <th class="item-name">Item</th>
                <th class="item-price">Price</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
            <tr>
                <td class="item-qty">${item.quantity}</td>
                <td class="item-name">${item.item_name}</td>
                <td class="item-price">₹${(item.total || item.quantity * item.price).toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <table class="items-table">
        <tr class="total-row">
            <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
            <td style="text-align: right;"><strong>₹${data.total.toFixed(2)}</strong></td>
        </tr>
        ${isNc ? `
        <tr>
            <td colspan="3" style="text-align: center; color: #FF6B6B; font-size: 9pt;">
                *** NON-CHARGEABLE ORDER ***
            </td>
        </tr>
        ` : ''}
    </table>

    <div class="barcode">
        *${data.orderId.slice(0, 12)}*
    </div>

    <div class="footer">
        <div>Thank you for your order!</div>
        <div>Kitchen Copy</div>
        <div class="print-time">
            Printed: ${data.printedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
        </div>
    </div>

    <script>
        // Auto-print and close after printing
        window.onload = function() {
            window.print();
            setTimeout(function() {
                window.close();
            }, 1000);
        };
        
        // Fallback if window.close doesn't work
        window.onafterprint = function() {
            setTimeout(function() {
                window.close();
            }, 500);
        };
    </script>
</body>
</html>`;
}