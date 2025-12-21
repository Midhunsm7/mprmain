"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Staff = {
  id: string;
  name: string;
};

type AttendanceStatus =
  | "present"
  | "absent"
  | "half"
  | "leave"
  | "late";

const STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "half",
  "leave",
  "late",
];

export default function SupervisorAttendancePage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supervisor/staff");
      const data = await res.json();

      if (res.ok) {
        setStaffList(data);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (
    staffId: string,
    status: AttendanceStatus
  ) => {
    setSubmitting(`${staffId}-${status}`);

    try {
      const res = await fetch("/api/supervisor/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_id: staffId,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to mark attendance");
      } else {
        alert("Attendance marked successfully");
      }
    } catch (err) {
      console.error("Attendance error:", err);
      alert("Something went wrong");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading staff…
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No staff assigned to you.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Mark Attendance (Today)
      </h2>

      {staffList.map((staff) => (
        <div
          key={staff.id}
          className="flex items-center gap-2 border rounded p-3"
        >
          <div className="w-48 font-medium">
            {staff.name}
          </div>

          <div className="flex gap-1 flex-wrap">
            {STATUSES.map((status) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                disabled={submitting === `${staff.id}-${status}`}
                onClick={() =>
                  markAttendance(staff.id, status)
                }
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
