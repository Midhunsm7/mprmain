"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function OtherRevenuePage() {
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    received_on: "",
    recurring_day: "1",
    payment_method: "cash",
  });

  async function handleSubmit() {
    if (!form.title || !form.amount) {
      toast.error("Title and amount are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/other-revenue/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          amount: Number(form.amount),
          is_recurring: isRecurring,
          recurring_day: isRecurring ? Number(form.recurring_day) : null,
          received_on: form.received_on || null,
          payment_method: form.payment_method,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Revenue added successfully");

      setForm({
        title: "",
        description: "",
        amount: "",
        received_on: "",
        recurring_day: "1",
        payment_method: "cash",
      });
      setIsRecurring(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Add Other Revenue</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>Revenue Title *</Label>
          <Input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Rent income / Commission / Misc"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <Label>Amount *</Label>
          <Input
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
          />
        </div>

        <div>
          <Label>Received On</Label>
          <Input
            type="date"
            value={form.received_on}
            onChange={e => setForm({ ...form, received_on: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Monthly Recurring</Label>
          <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
        </div>

        {isRecurring && (
          <div>
            <Label>Recurring Day (1–28)</Label>
            <Input
              type="number"
              min={1}
              max={28}
              value={form.recurring_day}
              onChange={e =>
                setForm({ ...form, recurring_day: e.target.value })
              }
            />
          </div>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Add Revenue"}
        </Button>
      </CardContent>
    </Card>
  );
}
