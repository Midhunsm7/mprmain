"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Minus, Trash2, Printer, ShoppingCart, Receipt } from "lucide-react";

type EventBooking = {
  id: string;
  guest_name: string;
  event_type: string;
  start_time: string;
  end_time: string | null;
  bill_amount: number | null;
};

type Dish = {
  id: string;
  name: string;
  base_price: number;
  category: string;
};

type CartItem = {
  dish_id: string;
  name: string;
  quantity: number;
  price: number;
};

type KOTBill = {
  id: string;
  bill_number: string;
  total: number;
  created_at: string;
  subtotal: number;
  gst: number;
  items: Array<{
    item_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
};

export default function KotEventPage() {
  const [events, setEvents] = useState<EventBooking[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState<KOTBill[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "bills">("new");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
    loadDishes();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventBills(selectedEvent);
    }
  }, [selectedEvent]);

  async function loadEvents() {
    const { data } = await supabase
      .from("event_bookings")
      .select("id, guest_name, event_type, start_time, end_time, bill_amount")
      .eq("status", "ongoing")
      .order("start_time", { ascending: false });

    setEvents(data || []);
  }

  async function loadDishes() {
    const { data } = await supabase
      .from("dishes")
      .select("id, name, base_price, category")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    setDishes(data || []);
  }

  async function loadEventBills(eventId: string) {
    const { data: orders } = await supabase
      .from("kot_orders")
      .select("id")
      .eq("event_id", eventId)
      .eq("order_type", "event");

    if (!orders || orders.length === 0) {
      setBills([]);
      return;
    }

    const orderIds = orders.map(o => o.id);

    const { data: billsData } = await supabase
      .from("kot_bills")
      .select(`
        id,
        bill_number,
        total,
        subtotal,
        gst,
        created_at,
        kot_bill_items (
          item_name,
          quantity,
          price,
          total
        )
      `)
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    setBills(
      (billsData || []).map((bill: any) => ({
        ...bill,
        items: bill.kot_bill_items || [],
      }))
    );
  }

  function addDish(dish: Dish) {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish_id === dish.id);
      if (existing) {
        return prev.map((i) =>
          i.dish_id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          dish_id: dish.id,
          name: dish.name,
          quantity: 1,
          price: dish.base_price,
        },
      ];
    });
  }

  function updateQty(dish_id: string, qty: number) {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((i) => (i.dish_id === dish_id ? { ...i, quantity: qty } : i))
    );
  }

  function removeItem(dish_id: string) {
    setCart((prev) => prev.filter((i) => i.dish_id !== dish_id));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  async function createKot() {
    if (!selectedEvent || cart.length === 0) {
      alert("Select event and add items");
      return;
    }

    setLoading(true);

    const { data: order, error: orderErr } = await supabase
      .from("kot_orders")
      .insert({
        order_type: "event",
        event_id: selectedEvent,
        status: "open",
      })
      .select()
      .single();

    if (orderErr) {
      alert(orderErr.message);
      setLoading(false);
      return;
    }

    const items = cart.map((i) => ({
      order_id: order.id,
      dish_id: i.dish_id,
      item_name: i.name,
      quantity: i.quantity,
      price: i.price,
    }));

    const { error: itemsErr } = await supabase.from("kot_items").insert(items);

    if (itemsErr) {
      alert(itemsErr.message);
      setLoading(false);
      return;
    }

    alert("KOT created successfully ✅");
    setCart([]);
    loadEventBills(selectedEvent);
    setLoading(false);
  }

  async function generateBill(orderId: string) {
    const { data: order } = await supabase
      .from("kot_orders")
      .select("*, kot_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) return;

    const items = order.kot_items;
    const subtotal = items.reduce(
      (sum: number, i: any) => sum + i.price * i.quantity,
      0
    );
    const gst = subtotal * 0.05;
    const total = subtotal + gst;

    const { data: bill, error } = await supabase
      .from("kot_bills")
      .insert({
        order_id: orderId,
        subtotal,
        gst,
        total,
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const billItems = items.map((i: any) => ({
      bill_id: bill.id,
      item_name: i.item_name,
      quantity: i.quantity,
      price: i.price,
      total: i.price * i.quantity,
    }));

    await supabase.from("kot_bill_items").insert(billItems);
    await supabase
      .from("kot_orders")
      .update({ status: "billed" })
      .eq("id", orderId);

    alert("Bill generated successfully!");
    loadEventBills(selectedEvent);
  }

  async function addBillToEvent(billId: string, billTotal: number) {
    if (!selectedEvent) return;

    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;

    const currentBillAmount = event.bill_amount || 0;
    const newBillAmount = currentBillAmount + billTotal;

    const { error } = await supabase
      .from("event_bookings")
      .update({ bill_amount: newBillAmount })
      .eq("id", selectedEvent);

    if (error) {
      alert(error.message);
      return;
    }

    alert(`₹${billTotal} added to event bill. New total: ₹${newBillAmount}`);
    loadEvents();
  }

  function printBill(bill: KOTBill) {
    const event = events.find((e) => e.id === selectedEvent);
    if (!event) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT Bill - ${bill.bill_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; }
            .divider { border-top: 2px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { text-align: left; padding: 8px; }
            th { border-bottom: 1px solid #000; }
            .total-row { border-top: 2px solid #000; font-weight: bold; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KOT Bill</h1>
            <p>Bill No: ${bill.bill_number}</p>
            <p>Date: ${new Date(bill.created_at).toLocaleString()}</p>
          </div>
          <div class="divider"></div>
          <p><strong>Event:</strong> ${event.event_type}</p>
          <p><strong>Guest:</strong> ${event.guest_name}</p>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.item_name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${item.price.toFixed(2)}</td>
                  <td class="text-right">₹${item.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td>Subtotal:</td>
              <td class="text-right">₹${bill.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>GST (5%):</td>
              <td class="text-right">₹${bill.gst.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total:</td>
              <td class="text-right">₹${bill.total.toFixed(2)}</td>
            </tr>
          </table>
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  const currentEvent = events.find((e) => e.id === selectedEvent);
  const categories = Array.from(new Set(dishes.map((d) => d.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Event KOT Management
          </h1>
          <p className="text-gray-600">
            Create KOT orders and manage bills for event bookings
          </p>
        </div>

        {/* Event Selector */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Ongoing Event
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">-- Select Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_type} — {e.guest_name} (Current Bill: ₹
                {e.bill_amount || 0})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("new")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "new"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <ShoppingCart className="inline-block w-5 h-5 mr-2" />
                  New KOT Order
                </button>
                <button
                  onClick={() => setActiveTab("bills")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "bills"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Receipt className="inline-block w-5 h-5 mr-2" />
                  Bills ({bills.length})
                </button>
              </div>

              {activeTab === "new" ? (
                <div className="p-6 space-y-6">
                  {/* Menu */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Menu
                    </h2>
                    {categories.map((category) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
                          {category || "Other"}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {dishes
                            .filter((d) => d.category === category)
                            .map((d) => (
                              <button
                                key={d.id}
                                onClick={() => addDish(d)}
                                className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg rounded-lg p-4 text-left transition-all transform hover:scale-105"
                              >
                                <div className="font-semibold text-gray-800 mb-1">
                                  {d.name}
                                </div>
                                <div className="text-blue-600 font-bold">
                                  ₹{d.base_price}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Order Items
                    </h2>
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No items added yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-6">
                          {cart.map((i) => (
                            <div
                              key={i.dish_id}
                              className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm"
                            >
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">
                                  {i.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  ₹{i.price} each
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    updateQty(i.dish_id, i.quantity - 1)
                                  }
                                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                  disabled={i.quantity <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold">
                                  {i.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQty(i.dish_id, i.quantity + 1)
                                  }
                                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <div className="w-24 text-right font-semibold text-gray-800">
                                  ₹{(i.price * i.quantity).toFixed(2)}
                                </div>
                                <button
                                  onClick={() => removeItem(i.dish_id)}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                          <div className="flex justify-between text-gray-700">
                            <span>Subtotal:</span>
                            <span className="font-semibold">
                              ₹{subtotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-700">
                            <span>GST (5%):</span>
                            <span className="font-semibold">
                              ₹{gst.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={createKot}
                          disabled={loading}
                          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? "Creating..." : "Create KOT Order"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Event Bills
                  </h2>
                  {bills.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No bills generated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bills.map((bill) => (
                        <div
                          key={bill.id}
                          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-800">
                                {bill.bill_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(bill.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                ₹{bill.total.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-300">
                                  <th className="text-left pb-2">Item</th>
                                  <th className="text-center pb-2">Qty</th>
                                  <th className="text-right pb-2">Price</th>
                                  <th className="text-right pb-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.items.map((item, idx) => (
                                  <tr key={idx} className="border-b border-gray-200">
                                    <td className="py-2">{item.item_name}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">₹{item.price}</td>
                                    <td className="text-right">₹{item.total}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => printBill(bill)}
                              className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Printer className="w-4 h-4" />
                              Print Bill
                            </button>
                            <button
                              onClick={() => addBillToEvent(bill.id, bill.total)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                            >
                              Add to Event Bill
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}