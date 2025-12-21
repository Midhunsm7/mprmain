"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PurchaseCard from "@/components/purchase/PurchaseCard";

export default function RequestModal({
  request,
  onClose,
}: {
  request: any;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function doAction(action: "approve" | "verify" | "reject") {
    setLoading(true);
    const comment = prompt("Add a comment (optional):") ?? "";
    const res = await fetch("/api/purchase-requests/update", {
      method: "POST",
      body: JSON.stringify({
        request_id: request.id,
        action,
        comments: comment,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      alert("Failed: " + (json?.error ?? "unknown"));
    } else {
      onClose();
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <PurchaseCard request={request} />
          <div className="flex gap-2 mt-4">
            <Button onClick={() => doAction("approve")} disabled={loading}>
              Approve
            </Button>
            <Button onClick={() => doAction("verify")} disabled={loading}>
              Verify
            </Button>
            <Button
              variant="destructive"
              onClick={() => doAction("reject")}
              disabled={loading}
            >
              Reject
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="space-y-1 text-sm text-muted mt-3">
            <p>
              <strong>Created by:</strong> {request.created_by?.name ?? "—"}
            </p>
            <p>
              <strong>Passed by:</strong> {request.passed_by?.name ?? "—"}
            </p>
            <p>
              <strong>Approved by:</strong> {request.approved_by?.name ?? "—"}
            </p>
            <p>
              <strong>Verified by:</strong> {request.verified_by?.name ?? "—"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
