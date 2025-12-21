"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, ChefHat, Clock, FileText, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import supabase from "@/lib/supabaseClient";

type Staff = {
  id: string;
  name: string;
  department: string;
};

type KOTItem = {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  total?: number;
};

type Props = {
  orderId: string;
  onClose: (success?: boolean) => void;
  onSuccess?: () => void;
};

export default function NcModal({ orderId, onClose, onSuccess }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orderItems, setOrderItems] = useState<KOTItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    staff_id: "",
    department: "",
    meal_type: "lunch",
    notes: "",
    approved_by: ""
  });

  useEffect(() => {
    loadOrderItems();
    loadStaff();
    
    // Get current user as approver
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setForm(prev => ({ ...prev, approved_by: data.user.id }));
      }
    });
  }, [orderId]);

  const loadOrderItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("kot_items")
      .select("*")
      .eq("order_id", orderId);
    
    if (!error && data) {
      setOrderItems(data);
      // Calculate total
      const total = data.reduce(
        (sum, it) => sum + (it.total || it.quantity * it.price),
        0
      );
      setTotalAmount(total);
    }
    setLoading(false);
  };

  const loadStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, department')
      .order('name');
    
    if (!error && data) {
      setStaff(data);
    }
  };

  const handleSubmit = async () => {
    if (!form.staff_id) {
      alert("Please select staff member");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kot/nc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          staff_id: form.staff_id,
          department: form.department,
          meal_type: form.meal_type,
          notes: form.notes,
          approved_by: form.approved_by
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("✅ Order marked as Non-Chargeable");
      onSuccess?.();
      onClose(true);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStaff = staff.find(s => s.id === form.staff_id);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order items...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mark as Non-Chargeable</h2>
                  <p className="text-blue-100 text-sm">Staff meal / complimentary order</p>
                </div>
              </div>
              <button
                onClick={() => onClose()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Order Summary - FIXED: Added null check for orderItems */}
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Order Summary
              </h3>
              {orderItems && orderItems.length > 0 ? (
                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <span className="font-medium">{item.item_name}</span>
                        <span className="text-sm text-gray-500 ml-2">×{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        <div className="text-xs text-gray-500">₹{item.price.toLocaleString('en-IN')} each</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Value:</span>
                      <span className="text-blue-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No items found in this order
                </div>
              )}
            </div>

            {/* Rest of the form remains the same... */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Staff Member *
                </label>
                <Select
                  value={form.staff_id}
                  onValueChange={(value) => {
                    const selected = staff.find(s => s.id === value);
                    setForm({
                      ...form,
                      staff_id: value,
                      department: selected?.department || ""
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading staff...</SelectItem>
                    ) : (
                      staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{s.name}</span>
                            <Badge variant="outline" className="ml-2">{s.department}</Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedStaff && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Selected: {selectedStaff.name}</span>
                    <Badge variant="outline" className="ml-2">{selectedStaff.department}</Badge>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <Input
                    value={form.department}
                    onChange={(e) => setForm({...form, department: e.target.value})}
                    placeholder="e.g., Kitchen, Service, Housekeeping"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <Select
                    value={form.meal_type}
                    onValueChange={(value) => setForm({...form, meal_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Reason
                </label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="Reason for non-chargeable meal (optional)"
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">Important Note</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      This order will be marked as Non-Chargeable and:
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Will not be included in revenue calculations</li>
                        <li>Will be recorded as staff meal consumption</li>
                        <li>Will reduce inventory counts</li>
                        <li>Cannot be reversed</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4">
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onClose()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!form.staff_id || submitting || orderItems.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {submitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Non-Chargeable
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}