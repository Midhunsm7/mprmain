/* app/kot/order/[id]/page.tsx
   Simple server-side order page placeholder that shows order header and items.
   If you already have a detailed order page, replace this or merge.
*/
import React from "react";
import { supabaseServer } from "@/lib/supabaseServer";
import { KOTOrder, KOTItem } from "@/lib/types/kot";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  params: { id: string };
};

async function fetchOrder(orderId: string) {
  const { data: order, error: orderErr } = await supabaseServer
    .from("kot_orders")
    .select("*")
    .eq("id", orderId)
    .limit(1)
    .single();

  if (orderErr) {
    console.error("Order fetch error", orderErr);
    return { order: null, items: [] };
  }

  const { data: items } = await supabaseServer
    .from("kot_items")
    .select("*")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  return { order: order as KOTOrder, items: (items ?? []) as KOTItem[] };
}

export default async function OrderPage({ params }: Props) {
  const { id } = params;
  const { order, items } = await fetchOrder(id);

  if (!order) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <p className="text-sm text-muted-foreground">Order {id} could not be loaded.</p>
        <Link href="/kot/tables"><Button className="mt-4">Back to Tables</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Order {order.id}</h1>
          <p className="text-sm text-muted-foreground">
            Table: {order.table_or_room ?? "Takeaway / Walk-in"} · Status: {order.status}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/kot/tables"><Button variant="ghost">Back to Tables</Button></Link>
          <Button onClick={() => { /* could call print or bill generation later */ }}>Generate Bill</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 && <div className="text-muted-foreground">No items added yet.</div>}
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-muted-foreground">Qty: {it.qty} · Status: {it.status}</div>
                </div>
                <div className="text-sm">{it.rate ? `₹${(it.rate * it.qty).toFixed(2)}` : "-"}</div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
