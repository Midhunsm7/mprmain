// app/admin/bookings/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { subscribeToTable } from "@/lib/supabaseRealtime";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Building,
  DollarSign,
  CheckCircle,
  Clock4,
  ChevronRight,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  TrendingUp,
  Users,
  Bed,
  RefreshCw,
  ArrowUpRight
} from "lucide-react";

interface Booking {
  id: string;
  name: string;
  room_ids: string[];
  check_in: string;
  booked_days: number;
  status: "checked-in" | "checked-out" | "pending";
  base_amount: number;
  total_charge: number;
  extra_hours: number;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    revenue: 0,
    averageStay: 0
  });

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guests")
      .select("id,name,room_ids,check_in,booked_days,status,base_amount,total_charge,extra_hours")
      .order("check_in", { ascending: false });

    if (error) console.error(error);
    const bookingData = (data ?? []) as Booking[];
    setBookings(bookingData);
    setFilteredBookings(bookingData);
    
    // Calculate stats
    const checkedInCount = bookingData.filter(b => b.status === "checked-in").length;
    const totalRevenue = bookingData.reduce((sum, b) => sum + (b.total_charge || b.base_amount || 0), 0);
    const avgStay = bookingData.length > 0 
      ? bookingData.reduce((sum, b) => sum + (b.booked_days || 1), 0) / bookingData.length 
      : 0;
    
    setStats({
      total: bookingData.length,
      checkedIn: checkedInCount,
      revenue: totalRevenue,
      averageStay: avgStay
    });
    
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const unsubG = subscribeToTable("guests", "ALL", () => fetchBookings());
    const unsubR = subscribeToTable("rooms", "ALL", () => fetchBookings());

    return () => {
      unsubG();
      unsubR();
    };
  }, []);

  useEffect(() => {
    let filtered = bookings;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.room_ids?.some(room => room.toString().includes(searchTerm))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "bg-gradient-to-r from-emerald-500 to-green-500";
      case "checked-out":
        return "bg-gradient-to-r from-blue-500 to-indigo-500";
      case "pending":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checked-in":
        return <CheckCircle className="h-4 w-4" />;
      case "checked-out":
        return <Clock4 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const calculateStayDuration = (checkIn: string, bookedDays: number) => {
    const checkInDate = new Date(checkIn);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, bookedDays || 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Bookings Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage guest bookings, check-ins, and room allocations</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/checkout"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium group"
              >
                <span>Checkout Dashboard</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">{stats.checkedIn} currently checked-in</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Guests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.checkedIn}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  In {bookings.filter(b => b.status === "checked-in").reduce((acc, b) => acc + (b.room_ids?.length || 1), 0)} rooms
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  From all bookings
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg. Stay</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageStay.toFixed(1)} days</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Bed className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Average duration per booking
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search by guest name or room number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="checked-in">Checked-in</option>
                    <option value="checked-out">Checked-out</option>
                    <option value="pending">Pending</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <button
                  onClick={fetchBookings}
                  className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <p className="mt-4 text-gray-600 text-lg">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No bookings found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search or filters' : 'No bookings have been created yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => {
                  const stayDuration = calculateStayDuration(booking.check_in, booking.booked_days);
                  const roomsCount = booking.room_ids?.length || 0;
                  
                  return (
                    <div
                      key={booking.id}
                      className="p-6 hover:bg-gray-50 transition-all duration-300 group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Guest Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100">
                                <User className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {booking.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${getStatusColor(booking.status)} text-white`}>
                                  {getStatusIcon(booking.status)}
                                  {booking.status === "checked-in" ? "Checked-in" : 
                                   booking.status === "checked-out" ? "Checked-out" : "Pending"}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">
                                    Rooms: <span className="font-medium text-gray-800">
                                      {roomsCount > 0 ? booking.room_ids?.join(", ") : "Not assigned"}
                                    </span>
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">
                                    Check-in: <span className="font-medium text-gray-800">
                                      {formatDate(booking.check_in)}
                                    </span>
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">
                                    Stay: <span className="font-medium text-gray-800">
                                      {stayDuration} of {booking.booked_days || 1} days
                                      {booking.extra_hours > 0 && ` + ${booking.extra_hours}h extra`}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amount and Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Total Amount</div>
                            <div className="text-2xl font-bold text-gray-900">
                              ₹{(booking.total_charge || booking.base_amount || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Base: ₹{(booking.base_amount || 0).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/bookings/${booking.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-medium group"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            
                            <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Footer */}
          {!loading && filteredBookings.length > 0 && (
            <div className="mt-6 text-sm text-gray-500 text-center">
              Showing {filteredBookings.length} of {bookings.length} bookings
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}