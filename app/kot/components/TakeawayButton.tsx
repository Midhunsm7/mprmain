"use client";
import React from "react";

export default function TakeawayButton({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      onClick={onCreate}
      className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded shadow transition"
      aria-label="Create takeaway order"
    >
      + Takeaway Order
    </button>
  );
}
