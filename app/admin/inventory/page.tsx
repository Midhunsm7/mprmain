// app/admin/inventory/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { subscribeToTable } from "@/lib/supabaseRealtime";
import {
  Search,
  Package,
  Filter,
  Plus,
  RefreshCw,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  Box,
  Edit,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type InventoryItem = {
  id: string;
  name: string;
  category?: string;
  unit?: string;
  stock: number;
  unit_price?: number;
  vendor_id?: string;
  vendor?: {
    name: string;
  };
  source?: string;
  source_type?: string;
  source_details?: any;
  last_restocked?: string;
  threshold?: number;
  created_at: string;
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [restockDialog, setRestockDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });
  const [restockQty, setRestockQty] = useState("");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });
  const [editForm, setEditForm] = useState({
    source: "",
    source_type: "",
    source_details: "",
  });

  // ------------------------------------------
  // FETCH ITEMS
  // ------------------------------------------
  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from("inventory_items").select(`
      *,
      vendor:vendor_id (name)
    `);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data, error } = await query.order("name");

    if (error) {
      console.error(error);
      toast.error("Failed to load inventory items");
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    const unsub = subscribeToTable("inventory_items", "ALL", () => fetchItems());
    return () => unsub();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search || selectedCategory !== "all") {
        fetchItems();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedCategory]);

  // ------------------------------------------
  // CATEGORIES
  // ------------------------------------------
  const categories = [
    "all",
    ...Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[]
  ];

  // ------------------------------------------
  // RESTOCK ITEM
  // ------------------------------------------
  const handleRestock = async () => {
    if (!restockDialog.item || !restockQty) return;

    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const newStock = (restockDialog.item.stock ?? 0) + qty;

    const { error } = await supabase
      .from("inventory_items")
      .update({
        stock: newStock,
        last_restocked: new Date().toISOString().split("T")[0],
      })
      .eq("id", restockDialog.item.id);

    if (error) {
      toast.error("Failed to restock: " + error.message);
    } else {
      toast.success(`Added ${qty} units to ${restockDialog.item.name}`);
      setRestockDialog({ open: false, item: null });
      setRestockQty("");
      fetchItems();
    }
  };

  // ------------------------------------------
  // UPDATE SOURCE META
  // ------------------------------------------
  const handleUpdateSource = async () => {
    if (!editDialog.item) return;

    let parsedDetails: any = {};
    if (editForm.source_details) {
      try {
        parsedDetails = JSON.parse(editForm.source_details);
      } catch (err) {
        toast.error("Invalid JSON format for source details");
        return;
      }
    }

    const { error } = await supabase
      .from("inventory_items")
      .update({
        source: editForm.source || null,
        source_type: editForm.source_type || null,
        source_details: Object.keys(parsedDetails).length > 0 ? parsedDetails : null,
      })
      .eq("id", editDialog.item.id);

    if (error) {
      toast.error("Failed to update: " + error.message);
    } else {
      toast.success("Source details updated");
      setEditDialog({ open: false, item: null });
      setEditForm({ source: "", source_type: "", source_details: "" });
      fetchItems();
    }
  };

  // ------------------------------------------
  // STATS CALCULATION
  // ------------------------------------------
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.stock < (item.threshold || 10)).length;
  const totalValue = items.reduce((sum, item) => 
    sum + (item.stock * (item.unit_price || 0)), 0
  );
  const outOfStockItems = items.filter(item => item.stock <= 0).length;

  // ------------------------------------------
  // RENDER PAGE
  // ------------------------------------------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all inventory items in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold mt-2">{totalItems}</p>
              </div>
              <Box className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold mt-2">{lowStockItems}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{totalValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold mt-2">{outOfStockItems}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH AND FILTERS */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={selectedCategory === cat ? "bg-accent" : ""}
                    >
                      {cat === "all" ? "All Categories" : cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={fetchItems}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          {selectedCategory !== "all" && (
            <div className="mt-3">
              <Badge variant="secondary" className="gap-1">
                {selectedCategory}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MAIN TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-muted-foreground">Loading inventory items...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No inventory items found
              </h3>
              <p className="text-gray-500">
                {search || selectedCategory !== "all"
                  ? "Try adjusting your search or filter"
                  : "Get started by adding your first inventory item"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Last Restocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isLowStock = item.stock < (item.threshold || 10);
                    const isOutOfStock = item.stock <= 0;
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.source_details && (
                            <div className="text-xs text-gray-500 mt-1">
                              <div className="line-clamp-1">
                                {JSON.stringify(item.source_details)}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.category || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              isOutOfStock ? 'text-red-600' :
                              isLowStock ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {item.stock}
                            </span>
                            {isLowStock && (
                              <Badge variant={isOutOfStock ? "destructive" : "outline"} className="text-xs">
                                {isOutOfStock ? "Out of Stock" : "Low Stock"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.unit || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.unit_price ? `₹${item.unit_price}` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.source || "—"}</div>
                            {item.source_type && (
                              <div className="text-xs text-gray-500">
                                {item.source_type}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.vendor?.name ? (
                            <Badge variant="secondary" className="text-xs">
                              {item.vendor.name}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.last_restocked
                            ? new Date(item.last_restocked).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setRestockDialog({ open: true, item });
                                  setRestockQty("");
                                }}
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Restock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditDialog({ open: true, item });
                                  setEditForm({
                                    source: item.source || "",
                                    source_type: item.source_type || "",
                                    source_details: item.source_details 
                                      ? JSON.stringify(item.source_details, null, 2)
                                      : "",
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Source
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Archive Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RESTOCK DIALOG */}
      <Dialog open={restockDialog.open} onOpenChange={(open) => setRestockDialog({ open, item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Restock Item
            </DialogTitle>
          </DialogHeader>
          {restockDialog.item && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Item:</span>
                  <span className="font-medium">{restockDialog.item.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <span className="font-bold">{restockDialog.item.stock} {restockDialog.item.unit || "units"}</span>
                </div>
                {restockDialog.item.threshold && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reorder Threshold:</span>
                    <span className="text-amber-600">{restockDialog.item.threshold}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Add</Label>
                <div className="relative">
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="Enter quantity"
                    className="text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  New stock will be: {restockDialog.item.stock + Number(restockQty || 0)}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setRestockDialog({ open: false, item: null })}
                >
                  Cancel
                </Button>
                <Button onClick={handleRestock} disabled={!restockQty}>
                  Confirm Restock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT SOURCE DIALOG */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Source Details
            </DialogTitle>
          </DialogHeader>
          {editDialog.item && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-lg">{editDialog.item.name}</div>
                <div className="text-sm text-gray-600">
                  {editDialog.item.category} • Stock: {editDialog.item.stock}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={editForm.source}
                    onChange={(e) => setEditForm({...editForm, source: e.target.value})}
                    placeholder="e.g., Vendor purchase, Internal transfer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type">Source Type</Label>
                  <Input
                    id="source_type"
                    value={editForm.source_type}
                    onChange={(e) => setEditForm({...editForm, source_type: e.target.value})}
                    placeholder="e.g., vendor_purchase, donation, internal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_details">Source Details (JSON)</Label>
                  <Textarea
                    id="source_details"
                    value={editForm.source_details}
                    onChange={(e) => setEditForm({...editForm, source_details: e.target.value})}
                    placeholder='{"invoice_no": "INV-123", "purchase_date": "2024-01-15"}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Enter valid JSON format for additional source details
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialog({ open: false, item: null })}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateSource}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}