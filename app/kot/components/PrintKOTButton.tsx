/* File: app/kot/components/PrintKOTButton.tsx
   Client component: triggers fetching printable HTML and prints directly
   using a hidden iframe approach for seamless printing.
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

      // Create hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      // Write content to iframe
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error("Unable to access iframe document");
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to load, then print
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // Remove iframe after print dialog closes (or after delay)
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 1000);
          } catch (printErr) {
            console.error("Print error:", printErr);
            document.body.removeChild(iframe);
          }
        }, 100);
      };

      // Log escpos payload for gateway forwarding
      console.log("ESC/POS base64 payload:", escpos_base64);

      // Optional: Forward to networked thermal printer gateway
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