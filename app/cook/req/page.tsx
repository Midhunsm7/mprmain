"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Plus, Trash2, Send, Package, AlertCircle } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type Staff = {
  id: string;
  name: string;
};

type RequestItem = {
  itemId: string;
  quantity: number;
  tempId: string;
};

export default function CookRequestPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<Staff | null>(null);
  
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    { itemId: "", quantity: 1, tempId: crypto.randomUUID() }
  ]);
  const [priority, setPriority] = useState<string>("normal");
  const [reason, setReason] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
    fetchKitchenStaff();
    fetchInventoryItems();
  }, []);

  const fetchKitchenStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id, name")
      .ilike("department", "kitchen")
      .order("created_at")
      .limit(1)
      .single();

    if (error || !data) {
      console.error(error);
      toast.error("No kitchen staff found");
      return;
    }

    setStaff(data);
  };

  const fetchInventoryItems = async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, unit, stock")
      .order("name");

    if (error) {
      console.error(error);
      toast.error("Failed to load inventory");
      return;
    }

    setItems(data || []);
  };

  const addItemRow = () => {
    setRequestItems([
      ...requestItems,
      { itemId: "", quantity: 1, tempId: crypto.randomUUID() }
    ]);
  };

  const removeItemRow = (tempId: string) => {
    if (requestItems.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setRequestItems(requestItems.filter(item => item.tempId !== tempId));
  };

  const updateItemRow = (tempId: string, field: string, value: any) => {
    setRequestItems(requestItems.map(item =>
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const submitRequest = async () => {
    if (!staff?.id) {
      toast.error("Staff not identified");
      return;
    }

    const validItems = requestItems.filter(item => item.itemId && item.quantity > 0);
    
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setLoading(true);

    const requestsToInsert = validItems.map(item => {
      const selectedItem = items.find(i => i.id === item.itemId);
      return {
        item_id: item.itemId,
        item_name: selectedItem?.name || "",
        quantity: item.quantity,
        priority,
        reason: reason || null,
        department: "kitchen",
        requested_by: staff.id,
        status: "pending",
      };
    });

    const { error } = await supabase
      .from("kitchen_inventory_request")
      .insert(requestsToInsert);

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Failed to submit inventory request");
      return;
    }

    toast.success(`${validItems.length} item(s) requested successfully`);

    // Reset form
    setRequestItems([{ itemId: "", quantity: 1, tempId: crypto.randomUUID() }]);
    setPriority("normal");
    setReason("");
  };

  const getSelectedItem = (itemId: string) => {
    return items.find(i => i.id === itemId);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white transform hover:scale-[1.01] transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Kitchen Inventory Request</CardTitle>
                {staff && (
                  <p className="text-blue-100 mt-1 text-sm">
                    Requested by: <strong>{staff.name}</strong>
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Request Card */}
        <Card className="border-none shadow-xl backdrop-blur-sm bg-white/90">
          <CardContent className="pt-6 space-y-6">
            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Request Items
                </h3>
                <Button
                  onClick={addItemRow}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {/* Item Rows */}
              <div className="space-y-3">
                {requestItems.map((item, index) => {
                  const selectedItem = getSelectedItem(item.itemId);
                  return (
                    <div
                      key={item.tempId}
                      className="group relative bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-top-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* Item Number Badge */}
                        <div className="md:col-span-1 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                            {index + 1}
                          </div>
                        </div>

                        {/* Item Selection */}
                        <div className="md:col-span-7">
                          <Select
                            value={item.itemId}
                            onValueChange={(val) => updateItemRow(item.tempId, "itemId", val)}
                          >
                            <SelectTrigger className="border-2 hover:border-blue-400 focus:border-blue-500 transition-colors bg-white shadow-sm">
                              <SelectValue placeholder="Select inventory item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  <div className="flex justify-between items-center w-full">
                                    <span className="font-medium">{inv.name}</span>
                                    <span className="text-xs text-slate-500 ml-4">
                                      Stock: {inv.stock} {inv.unit}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedItem && (
                            <p className="text-xs text-slate-600 mt-1 ml-1">
                              Available: {selectedItem.stock} {selectedItem.unit}
                            </p>
                          )}
                        </div>

                        {/* Quantity Input */}
                        <div className="md:col-span-3">
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemRow(item.tempId, "quantity", Number(e.target.value))}
                            placeholder="Qty"
                            className="border-2 hover:border-blue-400 focus:border-blue-500 transition-colors bg-white shadow-sm"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="md:col-span-1 flex items-center justify-center">
                          <Button
                            onClick={() => removeItemRow(item.tempId)}
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority & Reason Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-slate-200">
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Priority Level</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="border-2 hover:border-blue-400 focus:border-blue-500 transition-colors bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="normal">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Normal
                      </span>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Urgent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Reason (Optional)</label>
                <Textarea
                  placeholder="Why are these items needed?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border-2 hover:border-blue-400 focus:border-blue-500 transition-colors bg-white shadow-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Info Alert */}
            {requestItems.filter(i => i.itemId && i.quantity > 0).length > 0 && (
              <Alert className="bg-blue-50 border-blue-200 animate-in fade-in-50">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  You are requesting {requestItems.filter(i => i.itemId && i.quantity > 0).length} item(s).
                  All items will be submitted as a single request.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={submitRequest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting Request...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Submit Request ({requestItems.filter(i => i.itemId && i.quantity > 0).length} items)
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}