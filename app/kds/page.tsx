"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function KDSPage() {
  const [orders, setOrders] = useState([]);

  async function loadOrders() {
    const res = await fetch("/api/kot/list");
    const data = await res.json();
    setOrders(data.filter((o) => o.status !== "closed"));
  }

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel("kds-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "kot_items" }, () => loadOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      {orders.map((o) => (
        <div key={o.id} className="p-4 bg-white shadow rounded">
          <h2 className="font-bold mb-2">Order {o.id}</h2>
          <Items orderId={o.id} />
        </div>
      ))}
    </div>
  );
}

function Items({ orderId }: { orderId: string }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`/api/kot/order?id=${orderId}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, [orderId]);

  return (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.id} className="border-b py-1">
          {i.item_name} x {i.quantity}
        </li>
      ))}
    </ul>
  );
}
