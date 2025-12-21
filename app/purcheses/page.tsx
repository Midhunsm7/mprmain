"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import NotificationBell from "@/components/ui/NotificationBell";

export default function PurchasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [form, setForm] = useState({
    item_id: "",
    quantity: "",
    reason: "",
    description: "",
    priority: "normal",
    needed_by: "",
  });

  // Fetch inventory items
  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data } = await supabase
      .from("inventory_items")
      .select("id,name,unit");

    setItems(data || []);
  }

  // Quantity input with cleanup
  function handleQuantityChange(val: string) {
    val = val.replace(/[^0-9.]/g, ""); // allow only numbers and decimal
    if (val.startsWith("0") && !val.startsWith("0.")) {
      val = val.replace(/^0+/, ""); // remove leading zeros
    }
    if (val === "") val = "";
    setForm({ ...form, quantity: val });
  }

  async function submit() {
    if (!form.item_id || !form.quantity || !form.reason) {
      alert("Please fill required fields.");
      return;
    }

    await fetch("/api/purchase-requests/create", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        requested_by: "AUTH_USER_ID", // TODO replace with real auth user id later
      }),
    });

    alert("Purchase request submitted!");

    // Reset form
    setForm({
      item_id: "",
      quantity: "",
      reason: "",
      description: "",
      priority: "normal",
      needed_by: "",
    });
    setSelectedItem(null);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Page Header */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Create Purchase Request</h1>
        <NotificationBell role="purchase_manager" />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Item Selection */}
          <div>
            <Label>Select Item *</Label>
            <Select
              value={form.item_id}
              onValueChange={(v) => {
                setForm({ ...form, item_id: v });
                setSelectedItem(items.find((i) => i.id === v));
              }}
            >
              <SelectTrigger className="mt-1">Select Item</SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity + unit */}
          <div>
            <Label>Quantity *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                className="w-32"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />

              <div className="px-4 flex items-center rounded-md border bg-muted text-sm font-medium">
                {selectedItem?.unit || "—"}
              </div>
            </div>
          </div>

          {/* Needed By */}
          <div>
            <Label>Needed By</Label>
            <Input
              type="date"
              className="mt-1"
              value={form.needed_by}
              onChange={(e) => setForm({ ...form, needed_by: e.target.value })}
            />
          </div>

          {/* Reason (required) */}
          <div>
            <Label>Why is this needed? *</Label>
            <Textarea
              className="mt-1"
              placeholder="Explain purpose"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          {/* Optional description */}
          <div>
            <Label>Additional Notes</Label>
            <Textarea
              className="mt-1"
              placeholder="Any extra details?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm({ ...form, priority: v })}
            >
              <SelectTrigger className="mt-1 capitalize">
                {form.priority}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button className="w-full" onClick={submit}>
            Submit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
