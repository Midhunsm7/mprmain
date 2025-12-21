"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PurchaseCard from "@/components/purchase/PurchaseCard";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function AccountsPurchases() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("purchase_requests")
      .select("*, inventory_items(id,name,unit)")
      .in("status", ["submitted", "passed_by_accounts"])
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function passRequest(id: string) {
    const comment = prompt("Add a note for Admin (optional):") ?? "";
    const res = await fetch("/api/purchase-requests/update", {
      method: "POST",
      body: JSON.stringify({ request_id: id, action: "pass", comments: comment }),
    });
    const json = await res.json();
    if (!res.ok) alert("Failed: " + (json?.error ?? "unknown"));
    else load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Accounts — Purchase Requests</h1>
        <NotificationBell role="accounts" />
      </div>

      <div className="grid gap-4">
        {loading && <div>Loading…</div>}
        {!loading && requests.length === 0 && <div className="text-muted">No requests pending accounts</div>}
        {requests.map((r) => (
          <div key={r.id} className="flex items-start gap-4">
            <PurchaseCard request={r} />
            <div className="ml-auto self-center">
              <Button onClick={() => passRequest(r.id)}>Pass to Admin</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
