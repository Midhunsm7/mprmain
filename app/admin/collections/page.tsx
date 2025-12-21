"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndianRupee, Plus, Download } from "lucide-react";

/* ---------------- Types ---------------- */

type Totals = {
  cashCollected: number;
  nonCashCollected: number;
  totalRevenue: number;
  cashInHand: number;
};

type Purchase = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
};

type MonthlySummary = {
  cashCollected: number;
  nonCashCollected: number;
  cashSpent: number;
  netCash: number;
};

/* ---------------- Page ---------------- */

export default function AdminCollectionsPage() {
  const [loading, setLoading] = useState(true);

  const [totals, setTotals] = useState<Totals>({
    cashCollected: 0,
    nonCashCollected: 0,
    totalRevenue: 0,
    cashInHand: 0,
  });

  const [history, setHistory] = useState<Purchase[]>([]);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);

  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const [showPurchase, setShowPurchase] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadMonthlySummary();
  }, [month]);

  /* ---------------- Loaders ---------------- */

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadCollections(), loadHistory()]);
    setLoading(false);
  }

  async function loadCollections() {
    const res = await fetch("/api/cash/summary");
    if (!res.ok) return;
    const data = await res.json();
    setTotals(data);
  }

  async function loadHistory() {
    const res = await fetch("/api/cash/history");

    if (!res.ok) {
      setHistory([]);
      return;
    }

    const text = await res.text();
    if (!text) {
      setHistory([]);
      return;
    }

    const data = JSON.parse(text);
    setHistory(Array.isArray(data) ? data : []);
  }

  async function loadMonthlySummary() {
    const res = await fetch(
      `/api/cash/monthly-summary?month=${month}`
    );
    if (!res.ok) {
      setMonthly(null);
      return;
    }
    const data = await res.json();
    setMonthly(data);
  }

  /* ---------------- Actions ---------------- */

  async function submitLocalPurchase() {
    if (!amount || !description) return;

    setSubmitting(true);

    const res = await fetch("/api/cash/local-purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        description,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to record local purchase");
      setSubmitting(false);
      return;
    }

    setAmount("");
    setDescription("");
    setShowPurchase(false);
    await loadAll();
    await loadMonthlySummary();
    setSubmitting(false);
  }

  if (loading) {
    return <div className="p-6">Loading collections…</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Collections Overview</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              window.open("/api/cash/history/export", "_blank")
            }
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>

          <Button onClick={() => setShowPurchase(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Local Purchase
          </Button>
        </div>
      </div>

      {/* ---------------- Metrics ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Cash Collected"
          value={totals.cashCollected}
          color="bg-green-50"
        />
        <MetricCard
          title="UPI / Card / Bank"
          value={totals.nonCashCollected}
          color="bg-blue-50"
        />
        <MetricCard
          title="Total Revenue"
          value={totals.totalRevenue}
          color="bg-purple-50"
        />
        <MetricCard
          title="Cash In Hand"
          value={totals.cashInHand}
          color="bg-orange-50"
        />
      </div>

      {/* ---------------- Monthly Summary ---------------- */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Monthly Summary</CardTitle>
          <div className="flex gap-2">
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `/api/cash/monthly-summary/export?month=${month}`,
                  "_blank"
                )
              }
            >
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Cash Collected"
            value={monthly?.cashCollected ?? 0}
            color="bg-green-50"
          />
          <MetricCard
            title="Non-Cash"
            value={monthly?.nonCashCollected ?? 0}
            color="bg-blue-50"
          />
          <MetricCard
            title="Cash Spent"
            value={monthly?.cashSpent ?? 0}
            color="bg-red-50"
          />
          <MetricCard
            title="Net Cash"
            value={monthly?.netCash ?? 0}
            color="bg-purple-50"
          />
        </CardContent>
      </Card>

      {/* ---------------- Local Purchase Form ---------------- */}
      {showPurchase && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Add Local Purchase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              placeholder="Reason / Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={submitLocalPurchase} disabled={submitting}>
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPurchase(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------------- History ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Local Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No local purchases recorded
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Reason</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2">
                        {new Date(h.created_at).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>
                      <td className="p-2">{h.description}</td>
                      <td className="p-2 text-right font-medium">
                        ₹{Number(h.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Metric Card ---------------- */

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card className={`${color} border-none shadow-sm`}>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <IndianRupee className="w-5 h-5 text-muted-foreground" />
        <span className="text-2xl font-semibold">
          {value.toLocaleString("en-IN")}
        </span>
      </CardContent>
    </Card>
  );
}
