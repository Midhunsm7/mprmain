"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Package,
  Bell,
  History,
  ShoppingCart,
  ChefHat,
  Home,
  RefreshCw,
  TrendingDown,
  BarChart3,
  Download,
  Edit,
  Minus,
  ArrowUp,
  ArrowDown,
  Edit3,
  X,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  vendor_id: string | null;
  stock: number;
  unit_price: number;
  last_restocked: string | null;
  source: string | null;
  source_type: string | null;
  source_details: any | null;
  created_at?: string;
  threshold?: number;
}

interface StockEditModal {
  isOpen: boolean;
  item: InventoryItem | null;
  type: "add" | "remove" | null;
  quantity: number;
}

interface DeleteDialog {
  isOpen: boolean;
  item: InventoryItem | null;
}

const DEFAULT_THRESHOLD = 10;

// Predefined units with categories
const UNIT_OPTIONS = [
  // Weight units
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "oz", label: "Ounce (oz)" },

  // Volume units
  { value: "L", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "gal", label: "Gallon (gal)" },

  // Count units
  { value: "pcs", label: "Piece (pcs)" },
  { value: "pack", label: "Pack (pack)" },
  { value: "bottle", label: "Bottle (bottle)" },
  { value: "box", label: "Box (box)" },
  { value: "roll", label: "Roll (roll)" },
  { value: "pair", label: "Pair (pair)" },
  { value: "set", label: "Set (set)" },
  { value: "dozen", label: "Dozen (dozen)" },

  // Length units
  { value: "m", label: "Meter (m)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "ft", label: "Feet (ft)" },

  // Area units
  { value: "sqm", label: "Square Meter (sqm)" },
  { value: "sqft", label: "Square Feet (sqft)" },
];

// Predefined categories
const CATEGORY_OPTIONS = [
  "Food",
  "Beverages",
  "Housekeeping",
  "Maintenance",
  "Office Supplies",
  "Kitchen Equipment",
  "Cleaning",
  "Toiletries",
  "Linen",
  "Electronics",
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stockEditModal, setStockEditModal] = useState<StockEditModal>({
    isOpen: false,
    item: null,
    type: null,
    quantity: 0,
  });

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>({
    isOpen: false,
    item: null,
  });

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Food",
    unit: "pcs",
    stock: 0,
    threshold: DEFAULT_THRESHOLD,
    source: "purchase",
  });

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const itemsWithDefaults = (data || []).map((item) => ({
        ...item,
        threshold: item.threshold || DEFAULT_THRESHOLD,
      }));

      setInventory(itemsWithDefaults);
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();

    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
        },
        loadInventory
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInventory]);

  const filteredInventory = inventory.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "low")
      return item.stock <= (item.threshold || DEFAULT_THRESHOLD);
    return item.category === activeTab;
  });

  const lowStockItems = inventory.filter(
    (item) => item.stock <= (item.threshold || DEFAULT_THRESHOLD)
  );

  const handleCreateItem = async () => {
    if (!newItem.name.trim()) {
      toast.error("Please enter item name");
      return;
    }

    try {
      const { error } = await supabase.from("inventory_items").insert([
        {
          name: newItem.name.trim(),
          category: newItem.category,
          unit: newItem.unit,
          stock: newItem.stock || 0,
          threshold: newItem.threshold || DEFAULT_THRESHOLD,
          last_restocked: new Date().toISOString().split("T")[0],
          source: newItem.source,
          source_type: null,
          source_details: null,
        },
      ]);

      if (error) throw error;

      toast.success("Item added successfully!");
      setIsAddDialogOpen(false);
      setNewItem({
        name: "",
        category: "Food",
        unit: "pcs",
        stock: 0,
        threshold: DEFAULT_THRESHOLD,
        source: "purchase",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to add item");
    }
  };

  const handleUpdateStock = async (
    itemId: string,
    quantity: number,
    action: "add" | "remove"
  ) => {
    try {
      const item = inventory.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");

      // Check for valid quantity (greater than 0)
      if (quantity <= 0) {
        toast.error("Please enter a valid quantity greater than 0");
        return;
      }

      if (action === "remove") {
        // Check if quantity can be parsed as float
        const removeQuantity = parseFloat(quantity.toString());
        if (isNaN(removeQuantity)) {
          toast.error("Please enter a valid quantity");
          return;
        }

        // Allow decimal comparison for removal
        if (removeQuantity > parseFloat(item.stock.toString())) {
          toast.error(
            `Cannot remove more than available stock (${item.stock} ${item.unit})`
          );
          return;
        }
      }

      const currentStock = parseFloat(item.stock.toString());
      const newQuantity = parseFloat(quantity.toString());

      const newStock =
        action === "add"
          ? currentStock + newQuantity
          : Math.max(0, currentStock - newQuantity);

      const { error } = await supabase
        .from("inventory_items")
        .update({
          stock: newStock,
          last_restocked:
            action === "add" ? new Date().toISOString() : item.last_restocked,
        })
        .eq("id", itemId);

      if (error) throw error;

      // Log the stock change
      const { error: logError } = await supabase.from("stock_logs").insert([
        {
          item_id: itemId,
          action: action === "add" ? "in" : "out",
          quantity,
          note: `${action === "add" ? "Added" : "Removed"} ${quantity} ${
            item.unit
          }`,
          created_at: new Date().toISOString(),
        },
      ]);

      if (logError) console.error("Failed to log stock change:", logError);

      toast.success(
        `${quantity} ${item.unit} ${
          action === "add" ? "added to" : "removed from"
        } ${item.name}`
      );

      if (
        action === "remove" &&
        newStock <= (item.threshold || DEFAULT_THRESHOLD)
      ) {
        toast.error(`⚠️ ${item.name} is below threshold!`);
      }

      // Close modal
      setStockEditModal({ isOpen: false, item: null, type: null, quantity: 0 });
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ is_active: false })
        .eq("id", itemId)
        .eq("id", itemId);

      if (error) throw error;

      // Also delete associated stock logs
      const { error: logError } = await supabase
        .from("stock_logs")
        .update({ is_active: false })
        .eq("id", itemId)
        .eq("item_id", itemId);

      if (logError) console.error("Failed to delete stock logs:", logError);

      toast.success("Item deleted successfully!");
      setDeleteDialog({ isOpen: false, item: null });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const openStockEditModal = (item: InventoryItem, type: "add" | "remove") => {
    setStockEditModal({
      isOpen: true,
      item,
      type,
      quantity: 0,
    });
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setDeleteDialog({
      isOpen: true,
      item,
    });
  };

  const getStockStatus = (stock: number, threshold: number) => {
    const stockValue = parseFloat(stock.toString());
    const thresholdValue = parseFloat(threshold.toString());

    if (stockValue === 0)
      return {
        color: "bg-red-500",
        text: "Out of Stock",
        textColor: "text-red-700",
      };
    if (stockValue <= thresholdValue)
      return {
        color: "bg-red-500",
        text: "Low Stock",
        textColor: "text-red-600",
      };
    if (stockValue <= thresholdValue * 2)
      return {
        color: "bg-yellow-500",
        text: "Adequate",
        textColor: "text-yellow-600",
      };
    return { color: "bg-green-500", text: "Good", textColor: "text-green-600" };
  };

  // Format stock display with decimal places only if needed
  const formatStockDisplay = (stock: number) => {
    const stockValue = parseFloat(stock.toString());
    if (Number.isInteger(stockValue)) {
      return stockValue.toString();
    }
    // Show up to 2 decimal places
    return stockValue.toFixed(2).replace(/\.?0+$/, "");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Inventory Management
                </h1>
                <p className="text-gray-600">
                  Track and manage resort inventory
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={loadInventory}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2 border-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              icon: Package,
              label: "Total Items",
              value: inventory.length,
              gradient: "from-blue-500 to-blue-600",
              bg: "bg-blue-100",
              iconColor: "text-blue-600",
            },
            {
              icon: Bell,
              label: "Low Stock",
              value: lowStockItems.length,
              gradient: "from-yellow-500 to-yellow-600",
              bg: "bg-yellow-100",
              iconColor: "text-yellow-600",
            },
            {
              icon: BarChart3,
              label: "Categories",
              value: Array.from(new Set(inventory.map((item) => item.category)))
                .length,
              gradient: "from-green-500 to-green-600",
              bg: "bg-green-100",
              iconColor: "text-green-600",
            },
            {
              icon: TrendingDown,
              label: "Out of Stock",
              value: inventory.filter((item) => item.stock === 0).length,
              gradient: "from-red-500 to-red-600",
              bg: "bg-red-100",
              iconColor: "text-red-600",
            },
          ].map((stat, index) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="border-2 border-transparent hover:border-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden group">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:scale-105 transition-transform duration-300">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-full ${stat.bg} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div
                    className="mt-4 h-1 w-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to right, ${stat.gradient})`,
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inventory List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold">
                        Inventory Items
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {filteredInventory.length} items
                        </Badge>
                        {lowStockItems.length > 0 && (
                          <Badge variant="destructive" className="font-normal">
                            {lowStockItems.length} low stock
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full md:w-auto"
                    >
                      <TabsList className="flex flex-wrap bg-gray-100 p-1 rounded-xl border">
                        <TabsTrigger
                          value="all"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="low"
                          className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                          <Bell className="w-3 h-3 mr-2" />
                          Low Stock
                        </TabsTrigger>
                        {CATEGORY_OPTIONS.slice(0, 4).map((category) => (
                          <TabsTrigger
                            key={category}
                            value={category}
                            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                          >
                            {category}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-inner">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <TableRow>
                              <TableHead className="font-semibold text-gray-700">
                                Item Details
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700">
                                Category
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700">
                                Current Stock
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700">
                                Status
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence>
                              {filteredInventory.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    className="text-center py-12"
                                  >
                                    <div className="text-gray-500 space-y-4">
                                      <Package className="w-16 h-16 mx-auto opacity-30" />
                                      <div>
                                        <p className="text-lg font-medium">
                                          No items found
                                        </p>
                                        <p className="text-sm">
                                          Add your first inventory item to get
                                          started
                                        </p>
                                      </div>
                                      <Button
                                        onClick={() => setIsAddDialogOpen(true)}
                                        className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Item
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredInventory.map((item, index) => {
                                  const status = getStockStatus(
                                    item.stock,
                                    item.threshold || DEFAULT_THRESHOLD
                                  );
                                  return (
                                    <motion.tr
                                      key={item.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="hover:bg-gray-50/80 transition-colors border-b border-gray-100"
                                    >
                                      <TableCell>
                                        <div className="space-y-1">
                                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                            {item.name}
                                          </div>
                                          <div className="text-sm text-gray-500 flex items-center gap-1">
                                            <span>Unit:</span>
                                            <Badge
                                              variant="outline"
                                              className="text-xs font-normal"
                                            >
                                              {item.unit}
                                            </Badge>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="secondary"
                                          className="capitalize font-normal"
                                        >
                                          {item.category}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="space-y-1">
                                          <div
                                            className={`font-bold ${status.textColor} text-lg`}
                                          >
                                            {formatStockDisplay(item.stock)}{" "}
                                            {item.unit}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Threshold:{" "}
                                            {item.threshold ||
                                              DEFAULT_THRESHOLD}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          className={`${status.color} text-white capitalize hover:opacity-90 transition-opacity`}
                                        >
                                          {status.text}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              size="sm"
                                              variant="default"
                                              onClick={() =>
                                                openStockEditModal(item, "add")
                                              }
                                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                            >
                                              <ArrowUp className="w-4 h-4 mr-1" />
                                              Add
                                            </Button>
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                openStockEditModal(
                                                  item,
                                                  "remove"
                                                )
                                              }
                                              disabled={item.stock === 0}
                                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                              <ArrowDown className="w-4 h-4 mr-1" />
                                              Remove
                                            </Button>
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                openDeleteDialog(item)
                                              }
                                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </motion.div>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                  );
                                })
                              )}
                            </AnimatePresence>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions & Low Stock */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Item
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() =>
                        toast.info("Stock logs feature coming soon!")
                      }
                      variant="outline"
                      className="w-full justify-start border-2"
                    >
                      <History className="w-4 h-4 mr-2" />
                      View Stock Logs
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => toast.info("Export feature coming soon!")}
                      variant="outline"
                      className="w-full justify-start border-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Inventory
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-0 shadow-xl rounded-2xl bg-gradient-to-br from-red-50/50 to-red-100/50 backdrop-blur-sm border border-red-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <div className="p-2 rounded-lg bg-red-100 animate-pulse">
                        <Bell className="w-5 h-5 text-red-600" />
                      </div>
                      Low Stock Alerts
                    </CardTitle>
                    <CardDescription className="text-red-600/70">
                      Items need immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {lowStockItems.slice(0, 5).map((item, index) => {
                          const status = getStockStatus(
                            item.stock,
                            item.threshold || DEFAULT_THRESHOLD
                          );
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ x: 5 }}
                              className="p-4 bg-white/80 rounded-lg border border-red-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => openStockEditModal(item, "add")}
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="font-semibold text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-red-600 font-medium">
                                      Stock: {formatStockDisplay(item.stock)}{" "}
                                      {item.unit}
                                    </span>
                                    <span className="text-gray-600">
                                      Threshold:{" "}
                                      {item.threshold || DEFAULT_THRESHOLD}
                                    </span>
                                  </div>
                                </div>
                                <Badge className={`${status.color} text-white`}>
                                  {item.stock === 0 ? "OUT" : "LOW"}
                                </Badge>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <History className="w-5 h-5 text-gray-600" />
                    </div>
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Items Added Today
                      </span>
                      <span className="font-semibold text-green-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Stock Updates Today
                      </span>
                      <span className="font-semibold text-blue-600">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Restock Suggestions
                      </span>
                      <span className="font-semibold text-orange-600">
                        {lowStockItems.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Add New Item
            </DialogTitle>
            <DialogDescription>
              Enter details for the new inventory item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Item Name *</Label>
              <Input
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="e.g., Rice, Soap, Towels"
                className="border-2 focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Category *</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, category: value })
                  }
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Unit *</Label>
                <Select
                  value={newItem.unit}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, unit: value })
                  }
                >
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Initial Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.stock}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      stock: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  className="border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Low Stock Threshold</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.threshold}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      threshold:
                        parseFloat(e.target.value) || DEFAULT_THRESHOLD,
                    })
                  }
                  placeholder={DEFAULT_THRESHOLD.toString()}
                  min="0"
                  className="border-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Source</Label>
              <Select
                value={newItem.source}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, source: value })
                }
              >
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-2 w-full"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCreateItem}
                className="bg-gradient-to-r from-blue-600 to-blue-700 w-full"
              >
                Add Item
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Edit Modal */}
      <Dialog
        open={stockEditModal.isOpen}
        onOpenChange={(open) =>
          setStockEditModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {stockEditModal.type === "add" ? (
                <>
                  <ArrowUp className="w-6 h-6 text-green-600" />
                  Add Stock
                </>
              ) : (
                <>
                  <ArrowDown className="w-6 h-6 text-red-600" />
                  Remove Stock
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {stockEditModal.item && (
                <span className="text-gray-600">
                  Editing:{" "}
                  <span className="font-semibold">
                    {stockEditModal.item.name}
                  </span>
                  <br />
                  Current stock:{" "}
                  <span className="font-semibold">
                    {formatStockDisplay(stockEditModal.item.stock)}{" "}
                    {stockEditModal.item.unit}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">
                  {stockEditModal.type === "add"
                    ? "Quantity to Add"
                    : "Quantity to Remove"}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={stockEditModal.quantity || ""}
                  onChange={(e) =>
                    setStockEditModal((prev) => ({
                      ...prev,
                      quantity: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder={`Enter quantity in ${
                    stockEditModal.item?.unit || "units"
                  }`}
                  className="border-2 text-lg font-semibold py-6 text-center"
                  min="0"
                  step="any"
                  max={
                    stockEditModal.type === "remove"
                      ? stockEditModal.item?.stock
                      : undefined
                  }
                  autoFocus
                />
                {stockEditModal.type === "remove" && stockEditModal.item && (
                  <p className="text-sm text-red-600 mt-2">
                    Maximum removable:{" "}
                    {formatStockDisplay(stockEditModal.item.stock)}{" "}
                    {stockEditModal.item.unit}
                  </p>
                )}
              </div>

              {/* Quick Quantity Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 25].map((qty) => (
                  <motion.div
                    key={qty}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setStockEditModal((prev) => ({
                          ...prev,
                          quantity: qty,
                        }))
                      }
                      className="w-full border-2 hover:border-blue-500 hover:text-blue-600"
                    >
                      {qty}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            {stockEditModal.quantity > 0 && stockEditModal.item && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-gray-500">Current Stock:</span>
                      <div className="font-semibold text-lg">
                        {formatStockDisplay(stockEditModal.item.stock)}{" "}
                        {stockEditModal.item.unit}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500">
                        {stockEditModal.type === "add"
                          ? "After Adding:"
                          : "After Removing:"}
                      </span>
                      <div
                        className={`font-semibold text-lg ${
                          stockEditModal.type === "add"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stockEditModal.type === "add"
                          ? formatStockDisplay(
                              parseFloat(stockEditModal.item.stock.toString()) +
                                stockEditModal.quantity
                            )
                          : formatStockDisplay(
                              parseFloat(stockEditModal.item.stock.toString()) -
                                stockEditModal.quantity
                            )}{" "}
                        {stockEditModal.item.unit}
                      </div>
                    </div>
                  </div>

                  {stockEditModal.type === "add" && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-gray-500">
                        Status after update:
                      </span>
                      <Badge
                        className={`mt-1 ${
                          getStockStatus(
                            parseFloat(stockEditModal.item.stock.toString()) +
                              stockEditModal.quantity,
                            stockEditModal.item.threshold || DEFAULT_THRESHOLD
                          ).color
                        } text-white`}
                      >
                        {
                          getStockStatus(
                            parseFloat(stockEditModal.item.stock.toString()) +
                              stockEditModal.quantity,
                            stockEditModal.item.threshold || DEFAULT_THRESHOLD
                          ).text
                        }
                      </Badge>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <DialogFooter className="gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() =>
                  setStockEditModal({
                    isOpen: false,
                    item: null,
                    type: null,
                    quantity: 0,
                  })
                }
                className="border-2 w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => {
                  if (
                    stockEditModal.item &&
                    stockEditModal.type &&
                    stockEditModal.quantity > 0
                  ) {
                    handleUpdateStock(
                      stockEditModal.item.id,
                      stockEditModal.quantity,
                      stockEditModal.type
                    );
                  } else {
                    toast.error("Please enter a valid quantity");
                  }
                }}
                disabled={
                  !stockEditModal.quantity || stockEditModal.quantity <= 0
                }
                className={`w-full ${
                  stockEditModal.type === "add"
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
              >
                <Check className="w-4 h-4 mr-2" />
                {stockEditModal.type === "add"
                  ? `Add ${stockEditModal.quantity} ${stockEditModal.item?.unit}`
                  : `Remove ${stockEditModal.quantity} ${stockEditModal.item?.unit}`}
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Item
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete "{deleteDialog.item?.name}"?
              <br />
              <span className="font-semibold text-red-600">
                This action cannot be undone. All stock history for this item
                will be permanently deleted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Stock:</span>
                <span className="font-semibold">
                  {deleteDialog.item?.stock} {deleteDialog.item?.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <Badge variant="secondary" className="font-normal">
                  {deleteDialog.item?.category}
                </Badge>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-2 w-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.item && handleDeleteItem(deleteDialog.item.id)
              }
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
