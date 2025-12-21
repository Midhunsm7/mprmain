"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  staff_id: string;
  name?: string;
  reason: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [notes, setNotes] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/leave/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRequests(data.requests || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: "Approved" | "Rejected") => {
    if (!selected) return;

    try {
      const res = await fetch("/api/hr/leave/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status,
          note: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Leave ${status}`);
      setSelected(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 space-y-6">
      <h1 className="text-3xl font-bold">Leave Requests</h1>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No leave requests found.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border p-4 rounded-md bg-white shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{r.name || r.staff_id}</p>
                    <p className="text-sm text-gray-600">Reason: {r.reason}</p>
                    <p className="text-sm text-gray-600">Days: {r.days}</p>
                    <Badge
                      variant={
                        r.status === "Approved"
                          ? "success"
                          : r.status === "Rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>

                  {r.status === "Pending" && (
                    <Button onClick={() => setSelected(r)}>Review</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>

          {selected && (
            <>
              <p className="font-semibold text-lg mb-2">{selected.name}</p>
              <p className="text-sm text-gray-600 mb-4">
                Reason: {selected.reason}
              </p>

              <Textarea
                placeholder="Add HR notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4"
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => updateStatus("Rejected")}>
                  Reject
                </Button>
                <Button onClick={() => updateStatus("Approved")}>Approve</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
