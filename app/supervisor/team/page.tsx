"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Staff = {
  id: string;
  name: string;
  department: string;
};

export default function SupervisorTeamPage() {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    const { data } = await supabase
      .from("staff_supervisors")
      .select("staff:staff_id(id, name, department)");

    setStaff(data?.map((r: any) => r.staff) ?? []);
  };

  return (
    <div className="space-y-2">
      {staff.map((s) => (
        <div key={s.id} className="border p-3 rounded">
          <div className="font-medium">{s.name}</div>
          <div className="text-sm text-muted-foreground">
            {s.department}
          </div>
        </div>
      ))}
    </div>
  );
}
