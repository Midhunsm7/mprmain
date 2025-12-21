import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const { order_id } = await req.json();

  if (!order_id)
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });

  // get items
  const { data: items, error: itemsErr } = await supabaseServer
    .from("kot_items")
    .select("item_name, quantity")
    .eq("order_id", order_id);

  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // get last ticket number
  const { data: lastTicket } = await supabaseServer
    .from("kot_tickets")
    .select("ticket_no")
    .eq("order_id", order_id)
    .order("ticket_no", { ascending: false })
    .limit(1)
    .single();

  const ticket_no = lastTicket ? lastTicket.ticket_no + 1 : 1;

  // insert ticket snapshot
  const { error: insertErr } = await supabaseServer
    .from("kot_tickets")
    .insert({
      order_id,
      ticket_no,
      items,
    });

  if (insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // generate printable HTML
  const html = `
    <html>
      <body style="font-family: monospace; padding: 20px;">
        <h2>KOT Ticket #${ticket_no}</h2>
        <div>Order ID: ${order_id}</div>
        <hr/>
        <table style="width:100%; font-size: 16px;">
          <thead>
            <tr><th align="left">Item</th><th align="right">Qty</th></tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it) =>
                  `<tr><td>${it.item_name}</td><td align="right">${it.quantity}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
        <hr/>
        <div style="text-align:center;">Printed at ${new Date().toLocaleString()}</div>
      </body>
    </html>
  `;

  return NextResponse.json({
    message: "KOT Ticket created",
    ticket_no,
    html,
  });
}
