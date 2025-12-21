import React from "react";

type KotOrder = { id: string; table_no?: string | null; created_at: string };

export default function OrderList({
  loading,
  orders,
  onSelect,
}: {
  loading: boolean;
  orders: KotOrder[];
  onSelect: (o: KotOrder) => void;
}) {
  if (loading) return <div className="text-gray-500">Loading…</div>;
  if (!orders || orders.length === 0)
    return <div className="text-gray-500">No orders today.</div>;

  return (
    <div className="space-y-2 max-h-[600px] overflow-auto">
      {orders.map((o) => (
        <div
          key={o.id}
          onClick={() => onSelect(o)}
          className="p-2 rounded hover:bg-gray-50 cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium">Order {o.id.slice(0, 8)}</div>
            <div className="text-xs text-gray-400">
              {o.table_no ? `Table ${o.table_no}` : "Walk-in"} •{" "}
              {new Date(o.created_at).toLocaleTimeString()}
            </div>
          </div>
          <div className="text-xs text-gray-500">View</div>
        </div>
      ))}
    </div>
  );
}
