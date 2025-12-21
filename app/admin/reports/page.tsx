"use client";
import { useEffect, useState } from "react";

export default function AdminReports() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/reports/summary").then((r) => r.json()).then(setSummary);
  }, []);

  if (!summary) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total purchases</div>
          <div className="text-xl font-semibold">₹{Number(summary.purchases?.total_sum || 0).toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total payments</div>
          <div className="text-xl font-semibold">₹{Number(summary.payments?.paid_sum || 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
