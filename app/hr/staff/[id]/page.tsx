"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function StaffProfilePage() {
  const { id } = useParams();
  const [staff, setStaff] = useState<any>(null);
  const [salaryEdit, setSalaryEdit] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStaff() {
    try {
      const res = await fetch(`/api/hr/staff/get?id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      setStaff(data.staff);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employee");
    } finally {
      setLoading(false);
    }
  }

  const handleSalaryUpdate = async () => {
    if (!salaryEdit || !reason) {
      toast.error("Enter salary and reason");
      return;
    }

    const res = await fetch("/api/hr/staff/salary/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staff.id,
        new_salary: salaryEdit,
        reason,
      }),
    });

    const data = await res.json();
    if (!res.ok) return toast.error(data.error);

    toast.success("Salary updated");
    setReason("");
    setSalaryEdit("");
    loadStaff();
  };

  useEffect(() => {
    if (id) loadStaff();
  }, [id]);

  // 🔥 FIX: prevent crashing before staff loads
  if (loading) return <div className="p-6">Loading employee...</div>;

  if (!staff)
    return (
      <div className="p-6 text-red-500 font-semibold">
        ❌ Employee not found.
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{staff.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><strong>Phone:</strong> {staff.phone || "—"}</div>
          <div><strong>Email:</strong> {staff.email || "—"}</div>
          <div><strong>Department:</strong> {staff.department || "—"}</div>
          <div><strong>Address:</strong> {staff.address || "—"}</div>
          <div><strong>Joined:</strong> {staff.joined_at || "—"}</div>
          <div><strong>Salary:</strong> ₹{staff.salary}</div>
        </CardContent>
      </Card>

      {/* Salary Update Section */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Salary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>New Salary</Label>
          <Input
            type="number"
            value={salaryEdit}
            onChange={(e) => setSalaryEdit(e.target.value)}
          />

          <Label>Reason</Label>
          <Input
            placeholder="Promotion, performance, correction..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Button onClick={handleSalaryUpdate}>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
