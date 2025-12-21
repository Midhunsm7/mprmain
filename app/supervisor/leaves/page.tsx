"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function SupervisorLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("id, reason, days, staff(name)")
      .eq("status", "Pending");

    setLeaves(data ?? []);
  };

  const approveLeave = async (id: string) => {
    await supabase
      .from("leave_requests")
      .update({ status: "Approved by Supervisor" })
      .eq("id", id);

    loadLeaves();
  };

  return (
    <div className="space-y-3">
      {leaves.map((l) => (
        <div key={l.id} className="border p-3 rounded">
          <div className="font-medium">{l.staff.name}</div>
          <div className="text-sm">{l.reason} ({l.days} days)</div>
          <Button onClick={() => approveLeave(l.id)} className="mt-2">
            Approve & Send to HR
          </Button>
        </div>
      ))}
    </div>
  );
}
