"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VendorAddingPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
    account_number: "",
    outstanding_amount: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/vendors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          gst_number: form.gst_number || null,
          address: form.address || null,
          account_number: form.account_number || null,
          outstanding_amount: form.outstanding_amount
            ? Number(form.outstanding_amount)
            : 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add vendor");
      }

      toast.success("Vendor added successfully");

      // Reset form
      setForm({
        name: "",
        phone: "",
        email: "",
        gst_number: "",
        address: "",
        account_number: "",
        outstanding_amount: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Vendor</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Company Name */}
          <div>
            <Label>Company Name *</Label>
            <Input
              placeholder="Vendor / Company Name"
              value={form.name}
              onChange={e => updateField("name", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <Label>Phone</Label>
            <Input
              placeholder="Phone number"
              value={form.phone}
              onChange={e => updateField("phone", e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              placeholder="Email address"
              value={form.email}
              onChange={e => updateField("email", e.target.value)}
            />
          </div>

          {/* GSTIN */}
          <div>
            <Label>GSTIN (optional)</Label>
            <Input
              placeholder="GSTIN number"
              value={form.gst_number}
              onChange={e => updateField("gst_number", e.target.value)}
            />
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input
              placeholder="Vendor address"
              value={form.address}
              onChange={e => updateField("address", e.target.value)}
            />
          </div>

          {/* Account Number */}
          <div>
            <Label>Account Number</Label>
            <Input
              placeholder="Bank account number"
              value={form.account_number}
              onChange={e => updateField("account_number", e.target.value)}
            />
          </div>

          {/* Outstanding Amount */}
          <div>
            <Label>Outstanding Amount</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.outstanding_amount}
              onChange={e =>
                updateField("outstanding_amount", e.target.value)
              }
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Vendor"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
