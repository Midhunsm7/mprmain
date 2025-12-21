"use client";

import { useState, useEffect } from "react";

export default function StaffClient({ id }: { id: string }) {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch(`/api/staff/get?id=${id}`);
    const data = await res.json();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  async function update(field: string, value: any) {
    await fetch("/api/staff/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    load();
  }

if (loading) return <div className="p-6">Loading...</div>;
if (!staff) return <div className="p-6 text-red-600">Staff record not found.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{staff.name}</h1>

      <Editable label="Email" value={staff.email} save={(v) => update("email", v)} />
      <Editable label="Phone" value={staff.phone} save={(v) => update("phone", v)} />
      <Editable label="Address" value={staff.address} save={(v) => update("address", v)} />
      <Editable label="Department" value={staff.department} save={(v) => update("department", v)} />
      <Editable label="Aadhaar Number" value={staff.aadhaar} save={(v) => update("aadhaar", v)} />

      <TextareaEditable
        label="HR Policy"
        value={staff.hr_policy}
        save={(v) => update("hr_policy", v)}
      />
    </div>
  );
}

function Editable({ label, value, save }: any) {
  const [v, setV] = useState(value || "");
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-xs text-gray-500">{label}</div>
      <input
        className="border px-2 py-1 rounded w-full mt-1"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button
        onClick={() => save(v)}
        className="mt-2 bg-purple-600 text-white px-3 py-1 rounded"
      >
        Save
      </button>
    </div>
  );
}

function TextareaEditable({ label, value, save }: any) {
  const [v, setV] = useState(value || "");
  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="text-xs text-gray-500">{label}</div>
      <textarea
        className="border px-2 py-1 rounded w-full mt-1"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button
        onClick={() => save(v)}
        className="mt-2 bg-purple-600 text-white px-3 py-1 rounded"
      >
        Save
      </button>
    </div>
  );
}
