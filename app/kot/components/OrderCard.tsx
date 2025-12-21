/* File: app/kot/components/OrderCard.tsx
   Client component: compact order card with list of items,
   mark-item-ready buttons, print button.

   Assumptions:
   - Expects `order` and `items` props fetched by parent.
   - Uses fetch to call server routes defined below.
   - Uses Shadcn UI Button/Card components (replace imports as needed).
*/

"use client";

import React, { useState } from "react";
import { KOTOrder, KOTItem } from "@/lib/types/kot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PrintKOTButton from "./PrintKOTButton";

type Props = {
  order: KOTOrder;
  items: KOTItem[];
  refresh?: () => void; // optional callback after updates
};

export default function OrderCard({ order, items, refresh }: Props) {
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const setItemStatus = async (itemId: string, status: string) => {
    setLoadingIds((s) => [...s, itemId]);
    try {
      const res = await fetch("/api/kot/item/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (refresh) refresh();
    } catch (err) {
      console.error("Failed to update item status", err);
      alert("Failed to update item status");
    } finally {
      setLoadingIds((s) => s.filter((id) => id !== itemId));
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg">
            KOT #{order.id.slice(0, 8)}{" "}
            <span className="text-sm text-muted-foreground ml-2">
              {order.table_or_room ?? "Kitchen"}
            </span>
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString()}
            {order.assigned_pin ? ` · PIN: ${order.assigned_pin}` : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <PrintKOTButton orderId={order.id} />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  Qty: {it.qty} {it.rate ? `· ₹${it.rate}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <span
                    className={
                      it.status === "ready"
                        ? "text-green-600 font-medium"
                        : it.status === "in_progress"
                        ? "text-amber-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {it.status}
                  </span>
                </div>
                {it.status !== "ready" && (
                  <Button
                    size="sm"
                    onClick={() => setItemStatus(it.id, "ready")}
                    disabled={loadingIds.includes(it.id)}
                  >
                    Mark ready
                  </Button>
                )}
                {it.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItemStatus(it.id, "in_progress")}
                    disabled={loadingIds.includes(it.id)}
                  >
                    Start
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {order.notes && (
          <div className="mt-3 text-sm">
            <strong>Notes:</strong> {order.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
