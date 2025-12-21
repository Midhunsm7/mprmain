"use client";

import React, { useEffect, useState } from "react";
import OrderCard from "./OrderCard";
import useKotRealtime from "../hooks/useKotRealtime";

export default function OrderGrid() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Load initial KOT data
  async function load() {
    const res = await fetch("/api/kot/list").then((r) => r.json());
    setOrders(res || []);
  }

  // Attach realtime: new/updated/deleted orders sync
  useKotRealtime({
    onInsert: (o) => {
      setOrders((prev) => [o, ...prev]);
    },
    onUpdate: (o) => {
      setOrders((prev) => prev.map((p) => (p.id === o.id ? o : p)));
    },
    onDelete: (o) => {
      setOrders((prev) => prev.filter((p) => p.id !== o.id));
    },
  });

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Kitchen Orders</h1>
        <button
          onClick={load}
          className="bg-purple-600 text-white px-3 py-1 rounded shadow"
        >
          Refresh
        </button>
      </div>

      {/* GRID */}
      <div className="
        grid 
        grid-cols-1
        sm:grid-cols-2 
        md:grid-cols-3 
        lg:grid-cols-4 
        gap-4
      ">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            selected={selectedOrder?.id === o.id}
            onSelect={(ord) => setSelectedOrder(ord)}
          />
        ))}
      </div>

      {/* No orders */}
      {orders.length === 0 && (
        <div className="text-center mt-10 text-gray-500">
          No active orders
        </div>
      )}
    </div>
  );
}
