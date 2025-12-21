"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupervisorMyLeavePage() {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(1);

  const submitLeave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("leave_requests").insert({
      staff_id: user?.id,
      reason,
      days,
    });

    setReason("");
    setDays(1);
    alert("Leave request submitted");
  };

  return (
    <div className="space-y-3 max-w-md">
      <Input
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Input
        type="number"
        min={1}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
      />
      <Button onClick={submitLeave}>Submit Leave</Button>
    </div>
  );
}
