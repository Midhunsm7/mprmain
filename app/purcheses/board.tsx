"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "pending_account_verification", label: "Accounts Review" },
  { key: "pending_manager_approval", label: "Admin Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function PurchaseBoard() {
  const [requests, setRequests] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("purchase_requests")
      .select("*, inventory_items(name)");
      
    setRequests(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {STAGES.map(stage => (
        <div key={stage.key} className="space-y-3">
          <h2 className="font-bold text-lg">{stage.label}</h2>
          {requests
            .filter((r) => r.status === stage.key)
            .map((req) => (
              <Card key={req.id} className="p-3 shadow-md cursor-pointer hover:bg-gray-100">
                <p className="font-semibold">{req.inventory_items?.name}</p>
                <p className="text-sm text-gray-500">Qty: {req.quantity}</p>
                <p className="text-xs text-gray-400">{req.reason}</p>
              </Card>
            ))}
        </div>
      ))}
    </div>
  );
}
