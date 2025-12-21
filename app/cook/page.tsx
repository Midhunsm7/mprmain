"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  ChefHat,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  DollarSign,
  UtensilsCrossed,
  ShoppingCart,
  MessageSquare,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ResortSidebar, MenuButton } from "@/components/ui/ResortSidebar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface Dish {
  id: string;
  name: string;
  category: string;
  active: boolean;
}

interface KitchenReport {
  id: string;
  dish_id: string;
  dish_name: string;
  prepared_quantity: number;
  sold_quantity: number;
  cost_estimate: number;
  wastage: number;
  date: string;
}

interface InventoryRequest {
  id: string;
  item_name: string;
  item_id?: string;
  quantity: number;
  unit?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  priority: "low" | "normal" | "high" | "urgent";
  requested_by?: string;
  created_at: string;
}

interface NightReport {
  id: string;
  report_date: string;
  total_cost: number;
  total_wastage: number;
  most_prepared_dish: string;
  least_waste_dish: string;
  message_to_admin: string;
  sent_at: string;
}

export default function CookPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState({
    dishes: true,
    reports: true,
    requests: true,
  });
  const [today] = useState(new Date().toISOString().split("T")[0]);

  // Data states
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [reports, setReports] = useState<KitchenReport[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<
    InventoryRequest[]
  >([]);
  const [nightReports, setNightReports] = useState<NightReport[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [priority, setPriority] = useState<string>("normal");
  const [reason, setReason] = useState<string>("");

  // Form states
  const [current, setCurrent] = useState({
    dish_id: "",
    dish_name: "",
    preparedQty: 0,
    soldQty: 0,
    costEstimate: 0,
  });
  const [staff, setStaff] = useState<any>(null); // Added staff state
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Stats
  const [stats, setStats] = useState({
    totalCost: 0,
    totalWastage: 0,
    efficiency: 0,
    popularDish: "",
    highWasteDish: "",
  });

  // Fetch initial data
  useEffect(() => {
    fetchDishes();
    fetchTodayReports();
    fetchInventoryRequests();
    fetchNightReports();
    fetchInventoryItems();
    fetchStaffUser();
  }, []);

  // Update stats when reports change
  useEffect(() => {
    calculateStats();
  }, [reports]);

const fetchStaffUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.error("No authenticated user found");
      return;
    }

    const { data: staffRow, error } = await supabase
      .from("staff")
      .select("id")
      .eq("email", user.email)
      .single();

    if (error || !staffRow) {
      console.error("Staff not mapped for user:", user.email, error);
      return;
    }

    setStaff({ id: staffRow.id });
  } catch (error) {
    console.error("Error fetching staff:", error);
  }
};

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast.error("Failed to load dishes");
    } finally {
      setLoading((prev) => ({ ...prev, dishes: false }));
    }
  };

  const fetchTodayReports = async () => {
    try {
      const { data, error } = await supabase
        .from("kitchen_daily_report")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const fetchInventoryRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("kitchen_inventory_request")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setInventoryRequests(data || []);
    } catch (error) {
      console.error("Error fetching inventory requests:", error);
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  };

  const fetchNightReports = async () => {
    try {
      const { data, error } = await supabase
        .from("kitchen_night_report")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNightReports(data || []);
    } catch (error) {
      console.error("Error fetching night reports:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, unit, stock")
        .order("name");

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const calculateStats = () => {
    if (reports.length === 0) {
      setStats({
        totalCost: 0,
        totalWastage: 0,
        efficiency: 0,
        popularDish: "",
        highWasteDish: "",
      });
      return;
    }

    const totalCost = reports.reduce(
      (sum, r) => sum + (r.cost_estimate || 0),
      0
    );
    const totalWastage = reports.reduce((sum, r) => sum + (r.wastage || 0), 0);
    const totalPrepared = reports.reduce(
      (sum, r) => sum + (r.prepared_quantity || 0),
      0
    );
    const totalSold = reports.reduce(
      (sum, r) => sum + (r.sold_quantity || 0),
      0
    );

    const efficiency =
      totalPrepared > 0 ? (totalSold / totalPrepared) * 100 : 0;

    // Find popular dish
    const dishCounts = reports.reduce((acc, report) => {
      acc[report.dish_name] =
        (acc[report.dish_name] || 0) + report.prepared_quantity;
      return acc;
    }, {} as Record<string, number>);

    const popularDish =
      Object.entries(dishCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    // Find high waste dish
    const wasteByDish = reports.reduce((acc, report) => {
      if (report.wastage > 0) {
        acc[report.dish_name] = (acc[report.dish_name] || 0) + report.wastage;
      }
      return acc;
    }, {} as Record<string, number>);

    const highWasteDish =
      Object.entries(wasteByDish).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    setStats({
      totalCost,
      totalWastage,
      efficiency: parseFloat(efficiency.toFixed(1)),
      popularDish,
      highWasteDish,
    });
  };

  const handleDishSelect = (dishId: string) => {
    const selectedDish = dishes.find((d) => d.id === dishId);
    if (selectedDish) {
      setCurrent({
        ...current,
        dish_id: dishId,
        dish_name: selectedDish.name,
      });
    }
  };

  const handleAddReport = async () => {
    if (!current.dish_id || !current.dish_name) {
      toast.error("Please select a dish!");
      return;
    }

    if (current.preparedQty <= 0) {
      toast.error("Prepared quantity must be greater than 0!");
      return;
    }

    if (current.soldQty > current.preparedQty) {
      toast.error("Sold quantity cannot exceed prepared quantity!");
      return;
    }

    const wastage = current.preparedQty - current.soldQty;

    try {
      const { error } = await supabase.from("kitchen_daily_report").insert([
        {
          dish_id: current.dish_id,
          dish_name: current.dish_name,
          prepared_quantity: current.preparedQty,
          sold_quantity: current.soldQty,
          cost_estimate: current.costEstimate,
          wastage: wastage > 0 ? wastage : 0,
          date: today,
        },
      ]);

      if (error) throw error;

      toast.success("Report added successfully!");

      // Refresh reports
      fetchTodayReports();

      // Reset form
      setCurrent({
        dish_id: "",
        dish_name: "",
        preparedQty: 0,
        soldQty: 0,
        costEstimate: 0,
      });
    } catch (error) {
      console.error("Error adding report:", error);
      toast.error("Failed to add report");
    }
  };

  const handleInventoryRequest = async () => {
    try {
      if (!selectedItemId) {
        toast.error("Please select an item");
        return;
      }

      if (!quantity || quantity <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }

      if (!staff?.user_id) {
        toast.error("Staff not identified");
        return;
      }

      const { error } = await supabase
        .from("kitchen_inventory_request")
        .insert({
          item_id: selectedItemId, // ✅ REQUIRED FK
          quantity,
          priority,
          reason: reason || null,
          department: "kitchen",
          requested_by: staff.user_id,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Inventory request submitted");

      // reset form
      setSelectedItemId("");
      setQuantity(1);
      setReason("");
      setPriority("normal");

      // Refresh requests
      fetchInventoryRequests();
    } catch (err: any) {
      console.error("Create inventory request error:", err);
      toast.error(err.message || "Failed to submit request");
    }
  };

  const handleSendReport = async () => {
    if (!message.trim()) {
      toast.error("Please add a message for the report!");
      return;
    }

    try {
      const { error } = await supabase.from("kitchen_night_report").insert([
        {
          report_date: today,
          total_cost: stats.totalCost,
          total_wastage: stats.totalWastage,
          most_prepared_dish: stats.popularDish,
          least_waste_dish: stats.highWasteDish,
          message_to_admin: message,
          sent_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("📨 Night report sent to Super Admin!");
      setMessage("");
      fetchNightReports();
    } catch (error) {
      console.error("Error sending night report:", error);
      toast.error("Failed to send report");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "fulfilled":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      {/* Menu Button */}
      {!sidebarOpen && <MenuButton onClick={() => setSidebarOpen(true)} />}

      {/* Sidebar */}
      <ResortSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="p-4 sm:p-8 space-y-8">
        <div className="ml-0 sm:ml-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-amber-600" />
                Kitchen Operations Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage food preparation, costs, and inventory requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Badge>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Cost Today
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{stats.totalCost.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-600 bg-green-100 p-2 rounded-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Wastage
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalWastage} plates
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-red-600 bg-red-100 p-2 rounded-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Kitchen Efficiency
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.efficiency}%
                    </p>
                  </div>
                  {stats.efficiency >= 80 ? (
                    <TrendingUp className="h-10 w-10 text-green-600 bg-green-100 p-2 rounded-full" />
                  ) : (
                    <TrendingDown className="h-10 w-10 text-red-600 bg-red-100 p-2 rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Popular Dish
                    </p>
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {stats.popularDish || "No data"}
                    </p>
                  </div>
                  <UtensilsCrossed className="h-10 w-10 text-amber-600 bg-amber-100 p-2 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-4 lg:w-[600px]">
              <TabsTrigger
                value="dashboard"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Food Reports
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="night" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Night Report
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Today's Performance Overview</CardTitle>
                  <CardDescription>
                    Real-time kitchen metrics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Reports */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Today's Dish Reports
                      </h3>
                      {loading.reports ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : reports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ChefHat className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>No reports added yet for today</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-64">
                          {reports.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-3 border-b hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {report.dish_name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Prep: {report.prepared_quantity}</span>
                                  <span>Sold: {report.sold_quantity}</span>
                                  <span>Waste: {report.wastage}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ₹{report.cost_estimate.toFixed(2)}
                                </p>
                                <p
                                  className={`text-xs ${
                                    report.wastage > 5
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {(
                                    (report.sold_quantity /
                                      report.prepared_quantity) *
                                    100
                                  ).toFixed(1)}
                                  % efficiency
                                </p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                    </div>

                    {/* Recent Inventory Requests */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Recent Inventory Requests
                      </h3>
                      {loading.requests ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : inventoryRequests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>No inventory requests</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-64">
                          {inventoryRequests.slice(0, 5).map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-3 border-b hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {request.item_name}
                                  </p>
                                  <Badge
                                    className={getPriorityColor(
                                      request.priority
                                    )}
                                  >
                                    {request.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Qty: {request.quantity} {request.unit}
                                </p>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Food Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🍲 Add Food Preparation Report</CardTitle>
                  <CardDescription>
                    Track dish preparation, sales, and costs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label>Select Dish</Label>
                      <Select
                        value={current.dish_id}
                        onValueChange={handleDishSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a dish" />
                        </SelectTrigger>
                        <SelectContent>
                          {loading.dishes ? (
                            <div className="p-4 text-center">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            </div>
                          ) : (
                            dishes.map((dish) => (
                              <SelectItem key={dish.id} value={dish.id}>
                                {dish.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Prepared Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={current.preparedQty || ""}
                        onChange={(e) =>
                          setCurrent({
                            ...current,
                            preparedQty: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Plates prepared"
                      />
                    </div>
                    <div>
                      <Label>Sold Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        max={current.preparedQty}
                        value={current.soldQty || ""}
                        onChange={(e) =>
                          setCurrent({
                            ...current,
                            soldQty: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Plates sold"
                      />
                    </div>
                    <div>
                      <Label>Cost Estimate (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={current.costEstimate || ""}
                        onChange={(e) =>
                          setCurrent({
                            ...current,
                            costEstimate: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Cost"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {current.dish_id && (
                        <div className="text-sm text-gray-600">
                          <p>
                            Selected:{" "}
                            <span className="font-semibold">
                              {current.dish_name}
                            </span>
                          </p>
                          <p className="text-amber-600">
                            Wastage:{" "}
                            {Math.max(0, current.preparedQty - current.soldQty)}{" "}
                            plates
                          </p>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleAddReport} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Add Report
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Today's Reports
                    </h3>
                    {reports.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No reports added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((report) => {
                          const efficiency =
                            report.prepared_quantity > 0
                              ? (report.sold_quantity /
                                  report.prepared_quantity) *
                                100
                              : 0;
                          return (
                            <div
                              key={report.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div>
                                <p className="font-semibold">
                                  {report.dish_name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Prep: {report.prepared_quantity}</span>
                                  <span>Sold: {report.sold_quantity}</span>
                                  <span
                                    className={
                                      report.wastage > 0
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }
                                  >
                                    Waste: {report.wastage}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ₹{report.cost_estimate.toFixed(2)}
                                </p>
                                <Badge
                                  variant={
                                    efficiency >= 80 ? "default" : "destructive"
                                  }
                                >
                                  {efficiency.toFixed(1)}% efficient
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📦 Request Inventory Items</CardTitle>
                  <CardDescription>
                    Request ingredients and supplies from inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label>Item Name</Label>
                      <Select
                        value={selectedItemId}
                        onValueChange={setSelectedItemId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({item.stock} {item.unit} available)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={quantity || ""}
                        onChange={(e) =>
                          setQuantity(parseFloat(e.target.value) || 0)
                        }
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="normal">
                            Normal Priority
                          </SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">
                            Urgent Priority
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label>Reason (Optional)</Label>
                      <Input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why do you need this item?"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleInventoryRequest} className="gap-2">
                      <Send className="h-4 w-4" />
                      Send Request
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Requests
                    </h3>
                    {inventoryRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No inventory requests yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {inventoryRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <p className="font-semibold">
                                  {request.item_name}
                                </p>
                                <Badge
                                  className={getPriorityColor(request.priority)}
                                >
                                  {request.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Quantity: {request.quantity} {request.unit}
                                {request.reason &&
                                  ` • Reason: ${request.reason}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                Requested on{" "}
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Night Report Tab */}
            <TabsContent value="night" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>🌙 Send Night Report</CardTitle>
                    <CardDescription>
                      Summarize today's kitchen performance for management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Total Cost</p>
                          <p className="text-xl font-bold">
                            ₹{stats.totalCost.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Wastage</p>
                          <p className="text-xl font-bold">
                            {stats.totalWastage} plates
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className="text-xl font-bold">
                            {stats.efficiency}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Most Prepared</p>
                          <p className="text-lg font-semibold truncate">
                            {stats.popularDish || "-"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label>Message to Super Admin</Label>
                        <Textarea
                          placeholder="Summarize today's performance, challenges, and suggestions..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>

                      <Button
                        onClick={handleSendReport}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Send className="h-4 w-4" />
                        Send Night Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📋 Previous Night Reports</CardTitle>
                    <CardDescription>
                      View past reports sent to management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {nightReports.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No night reports sent yet</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {nightReports.map((report) => (
                            <div
                              key={report.id}
                              className="p-4 border rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold">
                                  {new Date(
                                    report.report_date
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <Badge variant="outline">
                                  Cost: ₹{report.total_cost.toFixed(2)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div>
                                  <p className="text-gray-600">Wastage</p>
                                  <p>{report.total_wastage} plates</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Popular Dish</p>
                                  <p className="truncate">
                                    {report.most_prepared_dish || "-"}
                                  </p>
                                </div>
                              </div>
                              {report.message_to_admin && (
                                <div className="mt-3 p-3 bg-gray-50 rounded">
                                  <p className="text-sm text-gray-700 line-clamp-3">
                                    {report.message_to_admin}
                                  </p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Sent at{" "}
                                {new Date(report.sent_at).toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
