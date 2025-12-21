/* File: app/kot/KitchenDisplayClient.tsx
   Kitchen Display (client). Subscribes to Supabase Realtime on `kot_items` changes
   and re-fetches active orders. Shows orders grouped with quick controls.
   Assumptions:
   - You have `@supabase/supabase-js` client available to client-side code (anon key).
   - Replace import `supabaseClient` if your client instance lives elsewhere.
*/

"use client";

import React, { useEffect, useState, useRef } from "react";
import { KOTOrder, KOTItem } from "@/lib/types/kot";
import OrderCard from "./components/OrderCard";
import { Button } from "@/components/ui/button";
// import your supabase client instance that is safe for client usage
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createClientComponentClient();

type AggregatedOrder = {
  order: KOTOrder;
  items: KOTItem[];
};

export default function KitchenDisplayClient() {
  const [orders, setOrders] = useState<AggregatedOrder[]>([]);
  const mounted = useRef(true);

  const fetchOpenOrders = async () => {
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from("kot_orders")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: true });
      if (ordersErr) throw ordersErr;
      const ordersArr = ordersData ?? [];

      const orderIds = ordersArr.map((o: any) => o.id);
      const { data: itemsData, error: itemsErr } = await supabase
        .from("kot_items")
        .select("*")
        .in("order_id", orderIds);
      if (itemsErr) throw itemsErr;

      const grouped = ordersArr.map((o: any) => {
        return {
          order: o as KOTOrder,
          items: (itemsData ?? []).filter((it: any) => it.order_id === o.id) as KOTItem[],
        };
      });

      if (mounted.current) setOrders(grouped);
    } catch (err) {
      console.error("Failed to fetch open orders", err);
    }
  };

  useEffect(() => {
    mounted.current = true;
    fetchOpenOrders();

    const subscription = supabase
      .channel("public:realtime-kot-items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kot_items" },
        (payload) => {
          // Any change in kot_items -> refresh open orders
          fetchOpenOrders();
        }
      )
      .subscribe();

    return () => {
      mounted.current = false;
      // unsubscribe
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Kitchen Display</h2>
        <Button onClick={() => fetchOpenOrders()}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((ag) => (
          <OrderCard
            key={ag.order.id}
            order={ag.order}
            items={ag.items}
            refresh={fetchOpenOrders}
          />
        ))}
        {orders.length === 0 && (
          <div className="text-muted-foreground">No open orders.</div>
        )}
      </div>
    </div>
  );
}
