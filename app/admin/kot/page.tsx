"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { subscribeToTable } from "@/lib/supabaseRealtime";
import { 
  Receipt, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Package, 
  Filter, 
  Search,
  ChefHat,
  Users,
  AlertCircle,
  TrendingUp,
  MoreVertical,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type KOTItem = {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  total?: number;
  billed_to_room?: boolean;
  billing_type?: string;
};

type KOTOrder = {
  id: string;
  table_no?: string | null;
  created_at: string;
  status: string;
  amount?: number;
  gst?: number;
  total?: number;
  order_type?: string;
  billing_type?: string;
  guest?: {
    name: string;
    room_number?: string;
  };
  kot_items?: KOTItem[];
  guest_id?: string;
  room_id?: string;
};

export default function AdminKOTPage() {
  const [orders, setOrders] = useState<KOTOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<KOTOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<KOTOrder | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === "open").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayRevenue = orders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // ---------------------------------------------------
  // FETCH ALL ORDERS
  // ---------------------------------------------------
  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kot_orders")
        .select(`
          *,
          kot_items(*),
          guest:guests(id, name),
          room:rooms(room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to include guest info
      const transformedOrders = (data || []).map(order => ({
        ...order,
        guest: order.guest ? {
          name: order.guest.name,
          room_number: order.room?.[0]?.room_number
        } : undefined
      }));

      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------
  // REALTIME LISTENER  
  // ---------------------------------------------------
  useEffect(() => {
    fetchOrders();

    const unsub = subscribeToTable("kot_orders", "ALL", () => {
      fetchOrders();
    });

    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // FILTER ORDERS
  // ---------------------------------------------------
  useEffect(() => {
    let result = orders;

    // Search filter
    if (search) {
      result = result.filter(order =>
        order.table_no?.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.guest?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(order => order.order_type === typeFilter);
    }

    setFilteredOrders(result);
  }, [orders, search, statusFilter, typeFilter]);

  // ---------------------------------------------------
  // CANCEL ORDER
  // ---------------------------------------------------
  async function cancelOrder(order_id: string) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch("/api/kot/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to cancel order");

      toast.success("Order cancelled successfully");
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    }
  }

  // ---------------------------------------------------
  // CLOSE ORDER (GENERATE BILL)
  // ---------------------------------------------------
  async function closeOrder(order_id: string) {
    if (!confirm("Close this order and generate bill?")) return;

    try {
      const res = await fetch("/api/kot/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to close order");

      toast.success("Order closed and bill generated successfully");
      await fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to close order");
    }
  }

  // ---------------------------------------------------
  // PRINT KOT TICKET
  // ---------------------------------------------------
  async function printKOT(order_id: string) {
    try {
      const res = await fetch("/api/kot/print-ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error("Failed to print KOT");

      const w = window.open("", "KOT Ticket", "width=400,height=600");
      w!.document.write(data.html);
      w!.document.close();
      
      toast.success("KOT ticket opened for printing");
    } catch (error) {
      toast.error("Failed to print KOT");
    }
  }

  // ---------------------------------------------------
  // GET STATUS BADGE
  // ---------------------------------------------------
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Open</Badge>;
      case "closed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Closed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "dine_in":
        return <Badge variant="outline" className="bg-blue-50">Dine In</Badge>;
      case "takeaway":
        return <Badge variant="outline" className="bg-purple-50">Takeaway</Badge>;
      case "room_service":
        return <Badge variant="outline" className="bg-emerald-50">Room Service</Badge>;
      default:
        return <Badge variant="outline">{type || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-orange-600" />
            KOT Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage kitchen order tickets in real-time
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchOrders}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold mt-2">{totalOrders}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold mt-2">{activeOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{todayRevenue.toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>All Orders</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search orders..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full sm:w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Order Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dine_in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                      <SelectItem value="room_service">Room Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No orders found
                    </h3>
                    <p className="text-gray-500">
                      {search || statusFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No orders have been placed yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id
                            ? "border-primary bg-blue-50"
                            : "hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-2 rounded-lg">
                              <Receipt className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {order.table_no ? `Table ${order.table_no}` : "Takeaway"}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(order.status)}
                                {getTypeBadge(order.order_type)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ₹{order.total?.toLocaleString() || "0"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Order ID</p>
                            <p className="font-mono text-xs">{order.id.slice(0, 8)}...</p>
                          </div>
                          {order.guest && (
                            <div>
                              <p className="text-gray-600">Guest</p>
                              <p className="font-medium">{order.guest.name}</p>
                              {order.guest.room_number && (
                                <p className="text-xs text-gray-500">Room {order.guest.room_number}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {order.kot_items && order.kot_items.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-600 mb-2">Items:</p>
                            <div className="flex flex-wrap gap-1">
                              {order.kot_items.slice(0, 3).map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {item.item_name} ×{item.quantity}
                                </Badge>
                              ))}
                              {order.kot_items.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{order.kot_items.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Details */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!selectedOrder ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Select an Order
                    </h3>
                    <p className="text-gray-500">
                      Click on an order from the list to view details
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedOrder.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Order Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold">
                            {selectedOrder.table_no ? `Table ${selectedOrder.table_no}` : "Takeaway Order"}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {new Date(selectedOrder.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(selectedOrder.status)}
                          {getTypeBadge(selectedOrder.order_type)}
                        </div>
                      </div>

                      {selectedOrder.guest && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{selectedOrder.guest.name}</span>
                            {selectedOrder.guest.room_number && (
                              <Badge variant="outline" className="text-xs">
                                Room {selectedOrder.guest.room_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Order Items</h3>
                      <div className="space-y-2">
                        {selectedOrder.kot_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{item.item_name}</p>
                              {item.billing_type && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.billing_type}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₹{item.price}</p>
                              <p className="text-sm text-gray-500">
                                ×{item.quantity} = ₹{Number(item.total ?? item.quantity * item.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border rounded-xl p-4">
                      <h3 className="font-semibold mb-3">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">₹{selectedOrder.amount?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST</span>
                          <span className="font-medium">₹{selectedOrder.gst?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-2xl font-bold text-green-600">
                              ₹{selectedOrder.total?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => printKOT(selectedOrder.id)}
                          className="gap-2"
                          variant="outline"
                        >
                          <Printer className="h-4 w-4" />
                          Print KOT
                        </Button>
                        <Button
                          onClick={() => closeOrder(selectedOrder.id)}
                          className="gap-2"
                          disabled={selectedOrder.status === "closed"}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Close Order
                        </Button>
                      </div>
                      <Button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        variant="destructive"
                        className="w-full gap-2"
                        disabled={selectedOrder.status === "cancelled"}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Order
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}