"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { subscribeToTable } from "@/lib/supabaseRealtime";

import OrderList from "./components/OrderList";
import AddItemModal from "./components/AddItemModal";
import PinAssignModal from "./components/PinAssignModal";
import NcModal from "./components/NcModal"; // New import
import TableTile from "./components/TableTile";
import { 
  Plus, 
  RefreshCw, 
  Printer, 
  Key, 
  XCircle, 
  UtensilsCrossed,
  Receipt,
  CheckCircle,
  Clock,
  Table2,
  Package,
  Hotel,
  Users,
  Shield,
  TrendingDown,
  ChefHat,
  DollarSign,
  Filter,
  Search,
  Download,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

type KOTOrder = {
  id: string;
  table_no?: string | null;
  created_at: string;
  billed_to_room?: boolean;
  status?: string;
  guest_id?: string | null;
  room_id?: string | null;
  room_pin?: string | null;
  total?: number;
  billing_type?: string;
  items?: any[];
};

type KOTItem = {
  id: string;
  item_name: string;
  quantity: number;
  price: number;
  total?: number;
  billed_to_room?: boolean;
  billing_type?: string;
};

export default function KotPage() {
  const [orders, setOrders] = useState<KOTOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<KOTOrder | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showNcModal, setShowNcModal] = useState(false);
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    ncOrders: 0,
    staffMealsValue: 0,
    todayNcCount: 0
  });

  // ------------------------------------------------------------
  // LOAD ORDERS
  // ------------------------------------------------------------
  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("kot_orders")
      .select("*")
      .in("status", ["open"])
      .order("created_at", { ascending: false });

    if (error) console.error("Load Orders Error:", error);
    setOrders(data || []);
    
    // Load NC stats
    await loadNcStats();
    setLoading(false);
  }

  async function loadNcStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's NC orders
    const { data: ncData } = await supabase
      .from("kot_orders")
      .select("*, kot_items(*)")
      .eq("billing_type", "nc")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);
    
    const ncOrders = ncData || [];
    const ncValue = ncOrders.reduce((sum, order) => {
      const orderTotal = order.kot_items?.reduce((itemSum: number, item: any) => 
        itemSum + (item.total || item.quantity * item.price), 0) || 0;
      return sum + orderTotal;
    }, 0);
    
    // Get all NC orders count
    const { count: totalNcCount } = await supabase
      .from("kot_orders")
      .select("*", { count: 'exact', head: true })
      .eq("billing_type", "nc");
    
    setStats({
      ncOrders: totalNcCount || 0,
      staffMealsValue: ncValue,
      todayNcCount: ncOrders.length
    });
  }

  // ------------------------------------------------------------
  // REALTIME LISTENER
  // ------------------------------------------------------------
  useEffect(() => {
    loadOrders();
    const unsub = subscribeToTable("kot_orders", "ALL", () => {
      loadOrders();
    });
    return () => unsub();
  }, []);

  // ------------------------------------------------------------
  // CREATE TAKEAWAY ORDER
  // ------------------------------------------------------------
  async function createOrder() {
    const res = await fetch("/api/kot/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table_no: null }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Failed to create order.");

    await loadOrders();
    setActiveOrder(data);
    setShowAddItem(true);
    setItemsRefreshKey((k) => k + 1);
  }

  // ------------------------------------------------------------
  // FIND ORDER FOR TABLE
  // ------------------------------------------------------------
  function getOrderForTable(tableNumber: number) {
    const label = `T${tableNumber}`;
    return (
      orders.find(
        (o) => o.table_no === label && (o.status === "open" || o.status === "room_billed")
      ) || null
    );
  }

  // ------------------------------------------------------------
  // TABLE CLICK HANDLER
  // ------------------------------------------------------------
  async function handleTableClick(tableNumber: number) {
    const existing = getOrderForTable(tableNumber);

    if (existing) {
      setActiveOrder(existing);
      setItemsRefreshKey((k) => k + 1);
      return;
    }

    const res = await fetch("/api/kot/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table_no: `T${tableNumber}` }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Failed to create order");

    await loadOrders();
    setActiveOrder(data);
    setShowAddItem(true);
    setItemsRefreshKey((k) => k + 1);
  }

  // ------------------------------------------------------------
  // PRINT KOT
  // ------------------------------------------------------------
  async function printKOT() {
    if (!activeOrder) return;

    const res = await fetch("/api/kot/print-ticket", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: activeOrder.id }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Failed to print KOT");

    const w = window.open("", "KOT Ticket", "width=400,height=600");
    w!.document.write(data.html);
    w!.document.close();
  }

  // ------------------------------------------------------------
  // MARK AS NON-CHARGEABLE
  // ------------------------------------------------------------
const handleMarkAsNc = async () => {
  if (!activeOrder) return;
  
  // Get order items
  const { data: items } = await supabase
    .from("kot_items")
    .select("*")
    .eq("order_id", activeOrder.id);
  
  if (!items || items.length === 0) {
    alert("Please add items to the order before marking as NC");
    setShowAddItem(true);
    return;
  }
  
  // Calculate total
  const total = items.reduce(
    (sum, it) => sum + (it.total || it.quantity * it.price),
    0
  );
  
  setShowNcModal(true);
  // Store the items and total for the modal
  // You might want to use a state or ref for this
};

  // ------------------------------------------------------------
  // CLOSE ORDER
  // ------------------------------------------------------------
  async function closeOrder() {
    if (!activeOrder) return;
    
    // If order is already NC
    if (activeOrder.billing_type === 'nc') {
      if (!confirm("This is a Non-Chargeable order. Mark as completed?")) return;
      
      const res = await fetch("/api/kot/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          order_id: activeOrder.id,
          is_nc: true 
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("✅ NC Order marked as completed");
      await loadOrders();
      setActiveOrder(null);
      return;
    }
    
    // If order is billed to room
    if (activeOrder.billed_to_room || activeOrder.status === "room_billed") {
      if (!confirm("This order is billed to a room. Mark as completed?")) return;
      
      const res = await fetch("/api/kot/close", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          order_id: activeOrder.id,
          is_room_billed: true 
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error);

      alert("✅ Order marked as completed (Charged to room)");
      await loadOrders();
      setActiveOrder(null);
      return;
    }

    // For regular orders, show bill summary
    if (!confirm("Close this order & generate bill?")) return;

    const res = await fetch("/api/kot/close", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order_id: activeOrder.id }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error);

    alert(
      `Final Bill\nSubtotal: ₹${data.subtotal}\nGST: ₹${data.gstAmount}\nTotal: ₹${data.finalTotal}`
    );

    await loadOrders();
    setActiveOrder(null);
  }

  // ------------------------------------------------------------
  // UI RENDER
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* HEADER */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md">
                <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                  Restaurant KOT System
                </h1>
                <p className="text-sm text-gray-600">
                  Manage tables, create orders, add items, and assign to rooms
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={createOrder}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>New Takeaway Order</span>
            </button>

            <button
              onClick={loadOrders}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ENHANCED STATS BAR WITH NC */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {/* Active Tables */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Tables</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {orders.filter(o => o.table_no && o.table_no.startsWith('T') && o.status === 'open').length}
                </p>
              </div>
              <Table2 className="h-10 w-10 text-blue-500 opacity-80" />
            </div>
          </motion.div>
          
          {/* Takeaway Orders */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Takeaway Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {orders.filter(o => !o.table_no && o.status === 'open').length}
                </p>
              </div>
              <Package className="h-10 w-10 text-emerald-500 opacity-80" />
            </div>
          </motion.div>
          
          {/* Room Billed */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Room Billed</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {orders.filter(o => o.status === 'room_billed').length}
                </p>
              </div>
              <Hotel className="h-10 w-10 text-purple-500 opacity-80" />
            </div>
          </motion.div>
          
          {/* Total Orders */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{orders.length}</p>
              </div>
              <Receipt className="h-10 w-10 text-amber-500 opacity-80" />
            </div>
          </motion.div>
          
          {/* NC Orders Today */}
         
          
          {/* Staff Meals Value */}
         
        </div>
      </motion.div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - TABLE LAYOUT */}
        <div className="lg:col-span-2 space-y-6">
          {/* TABLE GRID SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Table Layout</h2>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Available
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Occupied
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                    NC
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Click on a table to create or view order</p>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const number = i + 1;
                  const order = getOrderForTable(number);
                  return (
                    <motion.div
                      key={`table-${number}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <TableTile
                        tableNumber={number}
                        order={order}
                        onClick={() => handleTableClick(number)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ORDER DETAILS SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
              </div>
            </div>
            
            <div className="p-5 min-h-[400px]">
              {!activeOrder ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Clock className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Order Selected</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a table from the layout or choose an order from the list to view items, add items, or assign to a room.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* ORDER HEADER WITH NC BADGE */}
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${
                    activeOrder.billing_type === 'nc' 
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shadow-sm ${
                          activeOrder.billing_type === 'nc' ? 'bg-amber-100' : 'bg-white'
                        }`}>
                          <Receipt className={`h-5 w-5 ${
                            activeOrder.billing_type === 'nc' ? 'text-amber-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-800">
                              Order #{activeOrder.id.slice(0, 8).toUpperCase()}
                            </span>
                            
                            {/* NC BADGE */}
                            {activeOrder.billing_type === 'nc' && (
                              <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-medium rounded-full shadow-sm">
                                Non-Chargeable
                              </span>
                            )}
                            
                            {activeOrder.status === "room_billed" && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                Room Billed
                              </span>
                            )}
                            {activeOrder.billed_to_room && activeOrder.status !== "room_billed" && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Assigned to Room
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Table2 className="h-4 w-4" />
                              {activeOrder.table_no || "Takeaway"}
                            </span>
                            <span className="text-xs text-gray-500">
                              Created: {new Date(activeOrder.created_at).toLocaleTimeString()}
                            </span>
                            {activeOrder.room_pin && (
                              <span className="inline-flex items-center gap-1 text-sm text-purple-600">
                                <Hotel className="h-4 w-4" />
                                PIN: {activeOrder.room_pin}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2">
                      {activeOrder.status !== "room_billed" && activeOrder.billing_type !== 'nc' && (
                        <>
                          <button
                            onClick={() => setShowAddItem(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow transition-all duration-200 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4" />
                            Add Item
                          </button>

                          <button
                            onClick={printKOT}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow transition-all duration-200 text-sm font-medium"
                          >
                            <Printer className="h-4 w-4" />
                            Print KOT
                          </button>

                          {/* NC BUTTON */}
                          <button
                            onClick={handleMarkAsNc}
                            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow transition-all duration-200 text-sm font-medium"
                          >
                            <Shield className="h-4 w-4" />
                            Mark as NC
                          </button>
                        </>
                      )}

                      {activeOrder.status !== "room_billed" && activeOrder.billing_type !== 'nc' && !activeOrder.billed_to_room && (
                        <button
                          onClick={() => setShowPinModal(true)}
                          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow transition-all duration-200 text-sm font-medium"
                        >
                          <Key className="h-4 w-4" />
                          Assign Room
                        </button>
                      )}

                      {(activeOrder.status !== "room_billed" || activeOrder.billing_type === 'nc') && (
                        <button
                          onClick={closeOrder}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:shadow transition-all duration-200 text-sm font-medium ${
                            activeOrder.billing_type === 'nc'
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white'
                              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white'
                          }`}
                        >
                          <XCircle className="h-4 w-4" />
                          {activeOrder.billing_type === 'nc' 
                            ? 'Complete NC' 
                            : activeOrder.billed_to_room 
                              ? "Complete" 
                              : "Close Order"
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ITEMS LIST */}
                  <OrderItemsView
                    orderId={activeOrder.id}
                    refreshKey={itemsRefreshKey}
                    isNcOrder={activeOrder.billing_type === 'nc'}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - TODAY'S ORDERS */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-gray-700" />
                  <h2 className="text-xl font-bold text-gray-800">Today's Orders</h2>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  {orders.length} total
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Click to view order details</p>
            </div>
            
            <div className="p-5">
              <OrderList
                loading={loading}
                orders={orders}
                onSelect={(o) => {
                  setActiveOrder(o);
                  setItemsRefreshKey((k) => k + 1);
                }}
              />
            </div>
            
          </div>
        </motion.div>
      </div>

      {/* MODALS */}
      {showAddItem && activeOrder && activeOrder.status !== "room_billed" && activeOrder.billing_type !== 'nc' && (
        <AddItemModal
          orderId={activeOrder.id}
          onClose={async (added) => {
            setShowAddItem(false);
            if (added) {
              await loadOrders();
              setItemsRefreshKey((k) => k + 1);
            }
          }}
        />
      )}

      {showPinModal && activeOrder && activeOrder.status !== "room_billed" && activeOrder.billing_type !== 'nc' && !activeOrder.billed_to_room && (
        <PinAssignModal
          orderId={activeOrder.id}
          onClose={async (moved) => {
            setShowPinModal(false);
            if (moved) {
              await loadOrders();
              setItemsRefreshKey((k) => k + 1);
            }
          }}
        />
      )}

{showNcModal && activeOrder && (
  <NcModal
    orderId={activeOrder.id}
    onClose={async (success) => {
      setShowNcModal(false);
      if (success) {
        await loadOrders();
        setActiveOrder(null);
      }
    }}
  />
)}
    </div>
  );
}

/* ---------------- ORDER ITEMS VIEW ---------------- */
function OrderItemsView({
  orderId,
  refreshKey,
  isNcOrder = false,
}: {
  orderId: string;
  refreshKey: number;
  isNcOrder?: boolean;
}) {
  const [items, setItems] = useState<KOTItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderTotal, setOrderTotal] = useState(0);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("kot_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    setItems(data || []);
    
    // Calculate total
    const total = (data || []).reduce(
      (sum, it) => sum + Number(it.total ?? it.quantity * it.price),
      0
    );
    setOrderTotal(total);
    
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [orderId, refreshKey]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-48">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500">Loading items...</p>
    </div>
  );
  
  if (!items || items.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 text-center p-6">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Receipt className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Items Added Yet</h3>
      <p className="text-gray-500">
        Click "Add Item" to start adding items to this order
      </p>
    </div>
  );

  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.total ?? it.quantity * it.price),
    0
  );

  const roomBilledItems = items.filter(it => it.billed_to_room).length;
  const ncItems = items.filter(it => it.billing_type === 'nc').length;

  return (
    <div className="space-y-4">
      {/* ITEMS SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {items.length} Items
          </span>
          {roomBilledItems > 0 && (
            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium">
              {roomBilledItems} Room Billed
            </span>
          )}
          {ncItems > 0 && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full font-medium">
              {ncItems} Non-Chargeable
            </span>
          )}
        </div>
        <div className={`text-lg font-bold ${isNcOrder ? 'text-amber-800' : 'text-gray-800'}`}>
          Total: ₹{subtotal.toLocaleString("en-IN")}
          {isNcOrder && (
            <div className="text-sm font-normal text-amber-600">
              (Non-Chargeable Order)
            </div>
          )}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${isNcOrder ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((it) => (
                <tr 
                  key={it.id} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{it.item_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      {it.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-700">
                    ₹{Number(it.price).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                    ₹{Number(it.total ?? it.quantity * it.price).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {it.billed_to_room ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        <Hotel className="h-3 w-3" />
                        Room
                      </span>
                    ) : it.billing_type === 'nc' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-xs font-medium rounded-full">
                        <Shield className="h-3 w-3" />
                        NC
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Regular
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            
            {/* TOTALS ROW */}
            <tfoot className={isNcOrder ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-gray-50 to-gray-100'}>
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-700">
                  {isNcOrder ? 'Non-Chargeable Value' : 'Subtotal'}
                </td>
                <td className={`px-6 py-4 text-right font-bold text-lg ${
                  isNcOrder ? 'text-amber-800' : 'text-gray-900'
                }`}>
                  ₹{subtotal.toLocaleString("en-IN")}
                  {isNcOrder && (
                    <div className="text-xs font-normal text-amber-600">
                      Will be deducted from inventory
                    </div>
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}