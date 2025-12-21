"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Filter, 
  Utensils, 
  Bed, 
  Sparkles, 
  Boxes, 
  Calendar,
  Users,
  Building,
  TrendingUp,
  FileText,
  RefreshCw,
  Search,
  ChevronRight
} from "lucide-react";

interface AccountRow {
  id: string;
  base_amount: number;
  extra_hours: number;
  extra_charge: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
  category: string;
  description: string | null;
  quantity: number;
  guests: { name: string } | null;
  rooms: { room_number: string } | null;
}

export default function RevenueReportPage() {
  const [data, setData] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRevenue = async () => {
    setLoading(true);
    setIsRefreshing(true);

    // ------------------------
    // Fetch Room Revenue (accounts)
    // ------------------------
    let accountsQuery = supabase
      .from("accounts")
      .select("*, guests(name), rooms(room_number)")
      .order("created_at", { ascending: false });

    if (filterDate) {
      accountsQuery = accountsQuery
        .gte("created_at", `${filterDate}T00:00:00`)
        .lte("created_at", `${filterDate}T23:59:59`);
    }

    if (categoryFilter !== "all") {
      accountsQuery = accountsQuery.eq("category", categoryFilter);
    }

    const { data: accountRows, error: accErr } = await accountsQuery;
    if (accErr) console.error(accErr);

    // ------------------------
    // Fetch Restaurant Revenue (kot_bills)
    // ------------------------
    let kotQuery = supabase
      .from("kot_bills")
      .select("*, kot_orders(guest_id, room_id)")
      .order("created_at", { ascending: false });

    if (filterDate) {
      kotQuery = kotQuery
        .gte("created_at", `${filterDate}T00:00:00`)
        .lte("created_at", `${filterDate}T23:59:59`);
    }

    const { data: kotRows, error: kotErr } = await kotQuery;
    if (kotErr) console.error(kotErr);

    // Map Restaurant Bills
    const mappedKOT = (kotRows ?? []).map((bill) => ({
      id: bill.id,
      created_at: bill.created_at,
      category: "restaurant",
      description: bill.bill_number,
      total_amount: Number(bill.total),
      payment_method: "cash",
      guests: bill.kot_orders?.guest_id ? { name: "Room Guest" } : null,
      rooms: bill.kot_orders?.room_id
        ? { room_number: bill.kot_orders.room_id }
        : null,
    }));

    // ------------------------
    // Fetch Event Revenue (event_bookings)
    // ------------------------
    let eventQuery = supabase
      .from("event_bookings")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (filterDate) {
      eventQuery = eventQuery
        .gte("created_at", `${filterDate}T00:00:00`)
        .lte("created_at", `${filterDate}T23:59:59`);
    }

    const { data: eventRows, error: eventErr } = await eventQuery;
    if (eventErr) console.error(eventErr);

    // Map Events
    const mappedEvents = (eventRows ?? []).map((ev) => ({
      id: ev.id,
      created_at: ev.created_at,
      category: "event",
      description: `${ev.event_type} Booking`,
      total_amount: Number(ev.bill_amount || 0) + Number(ev.extra_charge || 0),
      payment_method: ev.payment_method || "cash",
      guests: ev.guest_name ? { name: ev.guest_name } : null,
      rooms: null,
    }));

    // ------------------------
    // Merge All Revenue Sources
    // ------------------------
    const unified = [
      ...(accountRows ?? []),
      ...mappedKOT,
      ...mappedEvents,
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setData(unified);
    setLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchRevenue();
  }, [filterDate, categoryFilter]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      item.guests?.name?.toLowerCase().includes(query) ||
      item.rooms?.room_number?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.payment_method?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const sum = (f: (r: AccountRow) => boolean) =>
    filteredData.filter(f).reduce((s, r) => s + (r.total_amount || 0), 0);

  const revenueTotal = sum(() => true);
  const revenueRoom = sum((r) => r.category === "room");
  const revenueRestaurant = sum((r) => r.category === "restaurant");
  const revenueService = sum((r) => r.category === "service");
  const revenueMisc = sum((r) => r.category === "misc");
  const revenueEvent = sum((r) => r.category === "event");

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'Z').toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString + 'Z').toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Revenue Dashboard
                </h1>
                <p className="text-slate-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Real-time revenue tracking across all sources
                </p>
              </div>
            </div>
            
            {/* Stats Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {filterDate ? formatDate(`${filterDate}T00:00:00`) : "All Time"}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {filteredData.length} Transactions
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {new Set(filteredData.map(d => d.guests?.name).filter(Boolean)).size} Guests
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={fetchRevenue}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* TOTAL */}
        <Card className="group bg-gradient-to-br from-green-50 to-white border-green-200/50 hover:border-green-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Total Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-900 mt-2">
                  ₹{revenueTotal.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-green-600 mt-1">All Sources Combined</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-green-100 to-green-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-300 rounded-full mt-4 group-hover:from-green-600 group-hover:to-green-400 transition-all duration-300"></div>
          </CardContent>
        </Card>

        {/* ROOMS */}
        <Card className="group bg-gradient-to-br from-slate-50 to-white border-slate-200/50 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-700 uppercase tracking-wider">Room Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2">
                  ₹{revenueRoom.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-slate-600 mt-1">Accommodation & Stay</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Bed className="w-5 h-5 text-slate-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-slate-500 to-slate-300 rounded-full mt-4"></div>
          </CardContent>
        </Card>

        {/* RESTAURANT */}
        <Card className="group bg-gradient-to-br from-orange-50 to-white border-orange-200/50 hover:border-orange-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">Restaurant</p>
                <p className="text-2xl lg:text-3xl font-bold text-orange-900 mt-2">
                  ₹{revenueRestaurant.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-orange-600 mt-1">Food & Beverage</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-orange-500 to-orange-300 rounded-full mt-4"></div>
          </CardContent>
        </Card>

        {/* EVENTS */}
        <Card className="group bg-gradient-to-br from-indigo-50 to-white border-indigo-200/50 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-indigo-700 uppercase tracking-wider">Events</p>
                <p className="text-2xl lg:text-3xl font-bold text-indigo-900 mt-2">
                  ₹{revenueEvent.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-indigo-600 mt-1">Banquets & Meetings</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full mt-4"></div>
          </CardContent>
        </Card>

        {/* SERVICES */}
        <Card className="group bg-gradient-to-br from-purple-50 to-white border-purple-200/50 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Services</p>
                <p className="text-2xl lg:text-3xl font-bold text-purple-900 mt-2">
                  ₹{revenueService.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-purple-600 mt-1">Additional Services</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full mt-4"></div>
          </CardContent>
        </Card>

        {/* MISC */}
        <Card className="group bg-gradient-to-br from-blue-50 to-white border-blue-200/50 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Miscellaneous</p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-900 mt-2">
                  ₹{revenueMisc.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-blue-600 mt-1">Other Income</p>
              </div>
              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Boxes className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mt-4"></div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FILTER PANEL */}
        <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Filter className="w-4 h-4 text-slate-600" />
              </div>
              Filters & Controls
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* SEARCH */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search Transactions
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest, room, category..."
                  className="pl-9 bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-400"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* DATE FILTER */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Filter by Date
              </label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            {/* CATEGORY FILTER */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Revenue Source
              </label>
              <div className="space-y-2">
                {[
                  { value: "all", label: "All Sources", color: "bg-slate-100 text-slate-700" },
                  { value: "room", label: "Room Bookings", color: "bg-slate-100 text-slate-700" },
                  { value: "restaurant", label: "Restaurant", color: "bg-orange-100 text-orange-700" },
                  { value: "event", label: "Events", color: "bg-indigo-100 text-indigo-700" },
                  { value: "service", label: "Services", color: "bg-purple-100 text-purple-700" },
                  { value: "misc", label: "Miscellaneous", color: "bg-blue-100 text-blue-700" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setCategoryFilter(item.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${categoryFilter === item.value ? `${item.color} border-l-4 border-slate-900 font-medium` : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {categoryFilter === item.value && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setFilterDate("");
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              Clear All Filters
            </Button>

            {/* STATS SUMMARY */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Transactions</span>
                  <span className="font-medium">{filteredData.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Amount</span>
                  <span className="font-medium text-green-600">₹{revenueTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Average/Transaction</span>
                  <span className="font-medium">
                    ₹{filteredData.length > 0 ? (revenueTotal / filteredData.length).toFixed(2) : '0'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN TABLE */}
        <div className="lg:col-span-3 space-y-6">
          {/* TABLE HEADER */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl text-slate-800">
                  Revenue Transactions
                  {searchQuery && (
                    <span className="text-sm font-normal text-slate-500 ml-2">
                      (Search: "{searchQuery}")
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Data</span>
                  </div>
                  <span>•</span>
                  <span>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                  </div>
                  <p className="text-slate-600 animate-pulse">Loading revenue data...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full">
                    <FileText className="w-12 h-12 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-700">No transactions found</h3>
                    <p className="text-slate-500 mt-1">
                      {searchQuery || filterDate || categoryFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'No revenue data available for the selected period'}
                    </p>
                  </div>
                  {(searchQuery || filterDate || categoryFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterDate("");
                        setCategoryFilter("all");
                        setSearchQuery("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200/50 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-slate-50 to-white">
                        <TableRow className="border-b border-slate-200">
                          <TableHead className="py-3.5 text-slate-700 font-semibold">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Date & Time
                            </div>
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Guest
                            </div>
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Room
                            </div>
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold">
                            Category
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold">
                            Description
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold text-right">
                            Amount
                          </TableHead>
                          <TableHead className="py-3.5 text-slate-700 font-semibold text-right">
                            Payment
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody className="divide-y divide-slate-100">
                        {filteredData.map((row, index) => (
                          <TableRow 
                            key={row.id} 
                            className="hover:bg-slate-50/50 transition-colors duration-150 animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="py-4">
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {formatDate(row.created_at)}
                                </div>
                                <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full inline-block">
                                  {formatTime(row.created_at)}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-slate-600" />
                                </div>
                                <span className="font-medium text-slate-800">
                                  {row.guests?.name || "—"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="py-4">
                              {row.rooms?.room_number ? (
                                <Badge 
                                  variant="outline" 
                                  className="border-slate-300 bg-white text-slate-700 px-3 py-1.5 rounded-full"
                                >
                                  <Building className="w-3 h-3 mr-1.5" />
                                  {row.rooms.room_number}
                                </Badge>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>

                            <TableCell className="py-4">
                              <Badge
                                className={`
                                  px-3 py-1.5 rounded-full font-medium border
                                  ${row.category === "room"
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : row.category === "restaurant"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : row.category === "event"
                                    ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                    : row.category === "service"
                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                                  }
                                `}
                              >
                                {row.category}
                              </Badge>
                            </TableCell>

                            <TableCell className="py-4">
                              <div className="max-w-[200px]">
                                <div className="text-sm font-medium text-slate-800 truncate">
                                  {row.description || "—"}
                                </div>
                                {row.category === "restaurant" && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    Restaurant Bill
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-4 text-right">
                              <div className="font-bold text-slate-900 text-lg">
                                ₹{row.total_amount.toLocaleString("en-IN")}
                              </div>
                              {row.base_amount && (
                                <div className="text-xs text-slate-500">
                                  Base: ₹{row.base_amount?.toLocaleString("en-IN") || '0'}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="py-4 text-right">
                              <Badge className={`
                                capitalize px-3 py-1.5 rounded-full
                                ${row.payment_method === 'cash' 
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : row.payment_method === 'upi'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : row.payment_method === 'card'
                                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                                }
                              `}>
                                {row.payment_method}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* TABLE FOOTER */}
                  <div className="bg-gradient-to-r from-slate-50 to-white border-t border-slate-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-sm text-slate-600">
                        Showing <span className="font-semibold text-slate-800">{filteredData.length}</span> of{' '}
                        <span className="font-semibold text-slate-800">{data.length}</span> transactions
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-600">
                          Page 1 of 1
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-300"
                          onClick={fetchRevenue}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Add custom animation styles
const styles = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}