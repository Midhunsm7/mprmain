"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Printer } from "lucide-react";

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AddStaffModal({ open, onOpenChange, onCreated }: AddStaffModalProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
    salary: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrintHRPolicy = () => {
    const pdfUrl = "/HR POLICIES.pdf";
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error("Unable to open print window. Please check your popup blocker.");
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/hr/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          department: form.department || null,
          salary: form.salary ? Number(form.salary) : null,
          address: form.address || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff");
      }

      toast.success("Employee added");
      onCreated();
      onOpenChange(false);
      setForm({ name: "", phone: "", email: "", department: "", salary: "", address: "" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add New Employee</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintHRPolicy}
              className="gap-2"
            >
              <Printer className="w-4 h-4" />
              Print HR Policy
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Employee name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Phone"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="Housekeeping / Front Desk / Kitchen..."
              />
            </div>
            <div>
              <Label>Salary (₹)</Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
                placeholder="25000"
              />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Employee address"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Add Employee"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}