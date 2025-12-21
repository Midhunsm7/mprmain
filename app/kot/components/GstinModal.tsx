"use client";
import { useState } from "react";

export default function GstinModal({ onSubmit, onClose }) {
  const [gstin, setGstin] = useState("");
  const [company, setCompany] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-5 rounded shadow w-80 space-y-3">
        <h2 className="text-lg font-bold">Add GSTIN (Optional)</h2>

        <input
          className="w-full border p-2 rounded"
          placeholder="GSTIN"
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ gstin, company })}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
