"use client";
import { useEffect, useState } from "react";

export default function AdminGST() {
  const [gst, setGst] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/gst/summary").then((r) => r.json()).then(setGst);
  }, []);

  if (!gst) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">GST Summary</h1>
      <div className="mt-4 bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-600">Total GST collected (purchases)</div>
        <div className="text-2xl font-semibold">₹{Number(gst.totalGST || 0).toLocaleString()}</div>
      </div>
    </div>
  );
}
