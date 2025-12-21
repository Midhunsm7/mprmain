"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NightAuditPage() {
  const [auditDate, setAuditDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runNightAudit = async () => {
    if (!auditDate) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/accounts/night-audit/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auditDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to run night audit");
      }

      setMessage("Night audit completed successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Night Audit</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Audit Date</label>
            <Input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={runNightAudit}
            disabled={!auditDate || loading}
          >
            {loading ? "Running Night Audit…" : "Run Night Audit"}
          </Button>

          {message && (
            <div className="text-sm text-green-600 font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
