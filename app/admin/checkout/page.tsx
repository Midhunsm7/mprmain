// app/admin/checkout/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function AdminCheckoutPage() {
  const [guests, setGuests] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from("guests").select("*").eq("status","checked-in").order("check_in",{ascending:false});
    setGuests(data ?? []);
  };

  useEffect(()=>{ fetch(); },[]);

  const goToCheckout = (guestId: string) => {
    // navigate to your existing checkout UI that accepts guest id, e.g. /checkout?guestId=...
    window.location.href = `/checkout?guestId=${guestId}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Checkouts</h1>
      <div className="space-y-3">
        {guests.map(g => (
          <div key={g.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{g.name}</div>
              <div className="text-xs text-gray-600">Rooms: {(g.room_ids || []).join(", ")}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => goToCheckout(g.id)}>Open Checkout</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
