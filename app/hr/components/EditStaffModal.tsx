"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  salary: number | null;
  total_salary: number | null;
  joined_at: string | null;
  address: string | null;
  upi_id?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  bank_name?: string | null;
  employee_id?: string | null;
  designation?: string | null;
  status?: string;
}

interface EditStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onUpdated: () => void;
}

export function EditStaffModal({ open, onOpenChange, staff, onUpdated }: EditStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Staff>>({
    name: "",
    phone: "",
    email: "",
    department: "",
    designation: "",
    salary: null,
    total_salary: null,
    address: "",
    status: "active",
    upi_id: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        phone: staff.phone || "",
        email: staff.email || "",
        department: staff.department || "",
        designation: staff.designation || "",
        salary: staff.salary || null,
        total_salary: staff.total_salary || null,
        address: staff.address || "",
        status: staff.status || "active",
        upi_id: staff.upi_id || "",
        account_number: staff.account_number || "",
        ifsc_code: staff.ifsc_code || "",
        bank_name: staff.bank_name || "",
      });
    }
  }, [staff]);

  const handleSubmit = async () => {
    if (!staff) return;
    
    if (!formData.name || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/hr/staff/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: staff.id, 
          ...formData,
          salary: formData.salary ? Number(formData.salary) : null,
          total_salary: formData.total_salary ? Number(formData.total_salary) : null,
        })
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      toast.success('Employee updated successfully');
      onUpdated();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee - {staff?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <Label>Employee ID</Label>
                <Input
                  value={formData.employee_id || staff?.employee_id || ""}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              
              <div>
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="notice_period">Notice Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Joined Date</Label>
                <Input
                  type="date"
                  value={formData.joined_at ? new Date(formData.joined_at).toISOString().split('T')[0] : ""}
                  onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Input
                  value={formData.department || ""}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="HR, Operations, Kitchen"
                />
              </div>
              
              <div>
                <Label>Designation</Label>
                <Input
                  value={formData.designation || ""}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Manager, Chef, Staff"
                />
              </div>
              
              <div>
                <Label>Basic Salary (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <Input
                    type="number"
                    className="pl-10"
                    value={formData.salary || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      salary: e.target.value ? Number(e.target.value) : null 
                    })}
                    placeholder="30000"
                  />
                </div>
              </div>
              
              <div>
                <Label>Total Salary (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                  <Input
                    type="number"
                    className="pl-10"
                    value={formData.total_salary || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      total_salary: e.target.value ? Number(e.target.value) : null 
                    })}
                    placeholder="35000"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Includes allowances, bonuses, deductions
                </p>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Banking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>UPI ID</Label>
                <Input
                  value={formData.upi_id || ""}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="example@upi"
                />
              </div>
              
              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.account_number || ""}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="123456789012"
                />
              </div>
              
              <div>
                <Label>IFSC Code</Label>
                <Input
                  value={formData.ifsc_code || ""}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  placeholder="SBIN0001234"
                />
              </div>
              
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={formData.bank_name || ""}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="State Bank of India"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Address</h3>
            <Textarea
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full residential address"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}