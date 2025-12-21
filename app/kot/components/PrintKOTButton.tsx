    /* File: app/kot/components/PrintKOTButton.tsx
   Client component: triggers fetching printable HTML and opens print window (browser),
   and optionally obtains ESC/POS base64 to forward to a printer gateway.
   Behavior:
   - When user clicks, fetch /api/kot/print?order_id=... -> returns { html, escpos_base64 }
   - Opens a new window and writes `html` into it, then calls print() (user will see print dialog).
   - Also exposes escpos_base64 in console for gateway forwarding.
*/

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PrintKOTButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kot/print?order_id=${orderId}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      const { html, escpos_base64 } = data;

      // Open print window and print
      const w = window.open("", "_blank", "width=600,height=800");
      if (!w) {
        alert("Popup blocked. Allow popups for this site to print.");
        setLoading(false);
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      // wait a tick for content to render
      setTimeout(() => {
        w.focus();
        w.print();
      }, 500);

      // Log escpos payload for gateway forwarding
      console.log("ESC/POS base64 payload (forward to printer gateway):", escpos_base64);

      // Optionally, if you have a networked printer gateway, you could POST escpos_base64 to it here.
      // Example (commented):
      // await fetch("http://printer-gateway.local/print", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ data_base64: escpos_base64 }),
      // });

    } catch (err) {
      console.error(err);
      alert("Failed to generate/print KOT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handlePrint} size="sm" disabled={loading}>
      {loading ? "Preparing..." : "Print KOT"}
    </Button>
  );
}
