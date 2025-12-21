/* File: lib/types/kot.ts
   Shared TypeScript types for KOT (orders + items).
   Assumptions:
   - kot_orders: id, table_or_room, billed_to_room, status, created_at, assigned_pin, notes
   - kot_items: id, order_id, name, qty, rate, status
*/
export type KOTOrder = {
  id: string;
  table_or_room?: string | null;
  billed_to_room?: boolean;
  status?: "open" | "closed" | "cancelled";
  created_at: string;
  assigned_pin?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

export type KOTItem = {
  id: string;
  order_id: string;
  name: string;
  qty: number;
  rate?: number | null;
  status: "pending" | "in_progress" | "ready" | "served";
};
