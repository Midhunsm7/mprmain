"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar, Package, AlertCircle, Clock, FileText, CheckCircle2, DollarSign, Tag, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PurchaseCreatePage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    item_id: "",
    quantity: "",
    reason: "",
    description: "",
    estimated_unit_price: "",
    budget_category: "operational",
    needed_by: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, unit, stock, category")
        .order("name");
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setItemsLoading(false);
    }
  }

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  function handleQuantityChange(val: string) {
    val = val.replace(/[^0-9.]/g, "");
    if (val.startsWith("0") && !val.startsWith("0.")) val = val.replace(/^0+/, "");
    setForm((s) => ({ ...s, quantity: val }));
  }

  function handlePriceChange(val: string) {
    val = val.replace(/[^0-9.]/g, "");
    setForm((s) => ({ ...s, estimated_unit_price: val }));
  }

  function calculateTotalCost() {
    const quantity = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.estimated_unit_price) || 0;
    return (quantity * price).toFixed(2);
  }

  async function submit() {
    if (!form.item_id || !form.quantity || !form.reason || !form.estimated_unit_price) {
      alert("Please fill required fields: item, quantity, estimated price, and reason.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_id: form.item_id,
          quantity: parseFloat(form.quantity),
          reason: form.reason,
          description: form.description,
          estimated_unit_price: parseFloat(form.estimated_unit_price),
          total_estimated_cost: parseFloat(calculateTotalCost()),
          budget_category: form.budget_category,
          needed_by: form.needed_by || null,
        }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json?.error?.message ?? json?.error ?? "Unknown error");
      
      alert(`Request submitted successfully! Bill Number: ₹{json.bill_number || 'Generated'}`);
      
      setForm({
        item_id: "",
        quantity: "",
        reason: "",
        description: "",
        estimated_unit_price: "",
        budget_category: "operational",
        needed_by: "",
      });
      setSelectedItem(null);
      setSearchQuery("");
      
    } catch (err: any) {
      console.error(err);
      alert("Submit failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const budgetCategories = [
    { value: "operational", label: "Operational", color: "bg-blue-100 text-blue-800" },
    { value: "capital", label: "Capital", color: "bg-purple-100 text-purple-800" },
    { value: "maintenance", label: "Maintenance", color: "bg-green-100 text-green-800" },
    { value: "office_supplies", label: "Office Supplies", color: "bg-yellow-100 text-yellow-800" },
    { value: "it_equipment", label: "IT Equipment", color: "bg-red-100 text-red-800" },
    { value: "other", label: "Other", color: "bg-gray-100 text-gray-800" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              Store Purchase Bill
            </h1>
            <p className="text-gray-600 mt-2">
              Request new items for store. All requests will be reviewed by purchase managers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell role="purchase_manager" />
            <Button
              variant="outline"
              onClick={loadItems}
              disabled={itemsLoading}
              className="gap-2"
            >
              Refresh Items
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-gray-200 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      Request Details
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Fill in the required information for your purchase request
                    </CardDescription>
                  </div>
                  <Badge className="px-3 py-1.5 border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                    
                    Total: ₹{calculateTotalCost()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Item Selection with Search */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Select Item *
                  </Label>
                  
                  {itemsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-10 w-3/4" />
                    </div>
                  ) : (
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full h-12 justify-between text-base"
                        >
                          {selectedItem ? selectedItem.name : "Search for an item..."}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Type to search items..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No items found.</CommandEmpty>
                            <CommandGroup>
                              {filteredItems.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.name}
                                  onSelect={() => {
                                    setForm((s) => ({ ...s, item_id: item.id }));
                                    setSelectedItem(item);
                                    setOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <div>
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-sm text-gray-500">
                                        Stock: {item.stock} {item.unit}
                                        {item.category && ` • ₹{item.category}`}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Quantity & Price Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Quantity *
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input
                          value={form.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          className="h-12 text-base pl-4 pr-12"
                          placeholder="Enter quantity"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                          {selectedItem?.unit || "unit"}
                        </div>
                      </div>
                      <div className="w-24 px-4 py-3 rounded-lg border-2 border-blue-100 bg-blue-50 text-center">
                        <div className="text-xs text-gray-600">Requested</div>
                        <div className="font-bold text-lg">{form.quantity || "0"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      
                      Estimated Unit Price *
                    </Label>
                    <div className="relative">
                      
                      <Input
                        value={form.estimated_unit_price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="h-12 text-base pl-10"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" />
                      Enter the estimated market price per unit
                    </div>
                  </div>
                </div>

                {/* Budget Category & Date */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Budget Category
                    </Label>
                    <Select
                      value={form.budget_category}
                      onValueChange={(v) => setForm((s) => ({ ...s, budget_category: v }))}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value} className="py-3">
                            <div className="flex items-center gap-3">
                              <span className={`h-2 w-2 rounded-full ₹{category.color.split(' ')[0]}`}></span>
                              <div>
                                <div className="font-medium">{category.label}</div>
                                <div className="text-sm text-gray-500">
                                  {category.value === "capital" ? "Long-term assets" : 
                                   category.value === "operational" ? "Day-to-day expenses" :
                                   category.value === "maintenance" ? "Repairs & upkeep" :
                                   "Miscellaneous expenses"}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Needed By Date
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={form.needed_by}
                        onChange={(e) => setForm((s) => ({ ...s, needed_by: e.target.value }))}
                        className="h-12 text-base pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Justification *
                  </Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
                    className="min-h-[100px] text-base"
                    placeholder="Explain why this purchase is necessary and how it will be used..."
                  />
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Include business impact and urgency
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Additional Information
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    className="min-h-[80px] text-base"
                    placeholder="Vendor preferences, specific model numbers, links to products, delivery instructions..."
                  />
                </div>

                <Separator className="my-4" />

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Fields marked with * are required
                  </div>
                  <Button
                    onClick={submit}
                    disabled={loading || !form.item_id || !form.quantity || !form.reason || !form.estimated_unit_price}
                    className="h-12 px-8 text-base font-medium gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Submit Purchase Request
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Cost Summary */}
              <Card className="shadow-lg border-emerald-200 rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-white">
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    
                    Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-semibold text-lg">
                        ₹{form.estimated_unit_price || "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold">
                        {form.quantity || "0"} {selectedItem?.unit || "units"}
                      </span>
                    </div>
                    <div className="pt-3 border-t-2">
                      <div className="flex justify-between items-center py-3 bg-emerald-50 -mx-3 px-3 rounded-lg">
                        <span className="text-gray-700 font-bold">Total Cost:</span>
                        <span className="text-2xl font-bold text-emerald-700">
                          {calculateTotalCost()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="text-sm text-gray-600 mb-2">Budget Category:</div>
                    {form.budget_category && (
                      <Badge className={`₹{budgetCategories.find(b => b.value === form.budget_category)?.color} px-3 py-1.5 font-medium`}>
                        {budgetCategories.find(b => b.value === form.budget_category)?.label}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Item Details */}
              <Card className="shadow-lg border-gray-200 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Item Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {selectedItem ? (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Item:</span>
                        <span className="font-semibold">{selectedItem.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-semibold">
                          {selectedItem.stock} {selectedItem.unit}
                        </span>
                      </div>
                      {selectedItem.category && (
                        <div className="flex justify-between items-center py-2 border-t">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-semibold">{selectedItem.category}</span>
                        </div>
                      )}
                      <div className="pt-4">
                        <div className="text-sm text-gray-500">
                          Requesting {form.quantity || "0"} units will bring stock to:
                        </div>
                        <div className="text-xl font-bold mt-2">
                          {(parseInt(selectedItem.stock || 0) + parseInt(form.quantity || 0)).toLocaleString()} {selectedItem.unit}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p>Select an item to see details</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="shadow-lg border-blue-100 rounded-2xl bg-gradient-to-br from-blue-50/50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <AlertCircle className="h-5 w-5" />
                    Cost Estimation Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Market Research</div>
                      <div className="text-gray-600">Check current market prices</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Include Tax & Shipping</div>
                      <div className="text-gray-600">Account for all additional costs</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Check Budget Limits</div>
                      <div className="text-gray-600">Stay within department budget</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}