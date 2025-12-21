"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, differenceInHours, addHours, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isPast, parseISO } from "date-fns";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableBody 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Calendar,
  Clock,
  User,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  CheckCheck,
  CalendarDays,
  Mail,
  Phone,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  Receipt
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface EventBooking {
  id: string;
  guest_name: string;
  event_type: string;
  start_time: string;
  end_time: string | null;
  status: "pending" | "confirmed" | "ongoing" | "completed" | "cancelled";
  bill_amount: number | null;
  extra_charge: number;
  payment_method: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  estimated_attendees?: number | null;
  special_requests?: string | null;
  booking_date?: string | null;
  duration_hours?: number | null;
  created_at?: string;
  advance_payment?: number | null;
  gstin?: string | null;
  company_name?: string | null;
  billing_address?: string | null;
}

export default function EventsPage() {
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  
  // Form state
  const [guest, setGuest] = useState("");
  const [type, setType] = useState("Banquet Hall");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendees, setAttendees] = useState(50);
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [startHour, setStartHour] = useState("10");
  const [duration, setDuration] = useState(4);
  
  // New fields for advance payment and GST
  const [enableGST, setEnableGST] = useState(false);
  const [gstin, setGstin] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [advancePayment, setAdvancePayment] = useState(0);
  const [enableAdvancePayment, setEnableAdvancePayment] = useState(false);
  
  // UI state
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdvancePaymentOpen, setIsAdvancePaymentOpen] = useState(false);
  const [extraCharge, setExtraCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventTypes = [
    { value: "Banquet Hall", label: "Banquet Hall", rate: 4500 },
    { value: "Meeting Room", label: "Meeting Room", rate: 2000 },
  ];

  const rates = {
    "Banquet Hall": 4500,
    "Meeting Room": 2000,
  };

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8 AM to 7 PM
    return { value: hour.toString().padStart(2, '0'), label: `${hour}:00` };
  });

  const durations = [
    { value: 2, label: "2 hours" },
    { value: 4, label: "4 hours" },
    { value: 6, label: "6 hours" },
    { value: 8, label: "8 hours" },
  ];

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
    ongoing: bookings.filter(b => b.status === 'ongoing').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.bill_amount || 0), 0),
    totalAdvance: bookings.reduce((sum, b) => sum + (b.advance_payment || 0), 0)
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return booking.status === 'pending' || booking.status === 'confirmed';
    if (activeTab === "ongoing") return booking.status === "ongoing";
    if (activeTab === "completed") return booking.status === "completed";
    if (activeTab === "cancelled") return booking.status === "cancelled";
    return true;
  });

  // Calendar functions
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const nextMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), 32));
  };

  const prevMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), -1));
  };

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadBookings();

    // Set up real-time subscription for event bookings
    const channel = supabase
      .channel('event-bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_bookings'
      }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBookings]);

  const calculateEstimatedAmount = () => {
    const baseRate = rates[type as keyof typeof rates] || 2000;
    return baseRate * duration;
  };

  const createBooking = async () => {
    if (!guest.trim()) {
      toast.error("Please enter guest name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter contact email");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter contact phone");
      return;
    }
    if (enableGST && !gstin.trim()) {
      toast.error("Please enter GSTIN for corporate booking");
      return;
    }
    if (enableAdvancePayment && advancePayment <= 0) {
      toast.error("Please enter a valid advance payment amount");
      return;
    }
    if (enableAdvancePayment && advancePayment > calculateEstimatedAmount()) {
      toast.error("Advance payment cannot exceed estimated amount");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Calculate start time from selected date and hour
      const startTime = new Date(bookingDate);
      startTime.setHours(parseInt(startHour), 0, 0, 0);
      
      const endTime = addHours(startTime, duration);
      const estimatedAmount = calculateEstimatedAmount();

      const bookingData: any = {
        guest_name: guest.trim(),
        event_type: type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        estimated_attendees: attendees,
        special_requests: specialRequests.trim(),
        booking_date: bookingDate.toISOString().split('T')[0],
        duration_hours: duration,
        extra_charge: 0,
        bill_amount: null,
        payment_method: null,
        advance_payment: enableAdvancePayment ? advancePayment : 0,
      };

      // Add GST fields if enabled
      if (enableGST) {
        bookingData.gstin = gstin.trim();
        if (companyName.trim()) bookingData.company_name = companyName.trim();
        if (billingAddress.trim()) bookingData.billing_address = billingAddress.trim();
      }

      const { data, error } = await supabase
        .from('event_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Booking Created Successfully!");
      resetForm();
      
    } catch (error: any) {
      console.error("Create booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmBooking = async (id: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .update({
          status: 'confirmed'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Booking Confirmed!");
      setIsConfirmOpen(false);
      
    } catch (error: any) {
      console.error("Confirm booking error:", error);
      toast.error(error.message || "Failed to confirm booking");
    } finally {
      setIsLoading(false);
    }
  };

  const checkin = async (id: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .update({
          status: 'ongoing',
          start_time: new Date().toISOString() // Update actual start time
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Check-in Successful!");
      setIsCheckinOpen(false);
      
    } catch (error: any) {
      console.error("Checkin error:", error);
      toast.error(error.message || "Failed to check in");
    } finally {
      setIsLoading(false);
    }
  };

  const checkout = async () => {
    if (!selectedBooking) return;

    setIsLoading(true);
    
    try {
      const start = new Date(selectedBooking.start_time);
      const end = new Date();
      const hours = Math.max(1, Math.ceil(differenceInHours(end, start) / 1) * 1);
      const baseRate = rates[selectedBooking.event_type as keyof typeof rates] || 2000;
      const baseAmount = hours * baseRate + extraCharge;
      
      // Deduct advance payment from total
      const advance = selectedBooking.advance_payment || 0;
      const finalAmount = Math.max(0, baseAmount - advance);

      const { data, error } = await supabase
        .from('event_bookings')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          bill_amount: finalAmount,
          extra_charge: extraCharge,
          payment_method: paymentMethod
        })
        .eq('id', selectedBooking.id)
        .select()
        .single();

      if (error) throw error;

      const message = advance > 0 
        ? `Checkout Complete — ₹${finalAmount.toLocaleString()} (₹${baseAmount.toLocaleString()} - ₹${advance.toLocaleString()} advance)`
        : `Checkout Complete — ₹${finalAmount.toLocaleString()}`;
      
      toast.success(message);
      setIsCheckoutOpen(false);
      setSelectedBooking(null);
      setExtraCharge(0);
      
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to checkout");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .update({
          status: 'cancelled'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Booking Cancelled");
      
    } catch (error: any) {
      console.error("Cancel error:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setIsLoading(false);
    }
  };

  const addAdvancePayment = async (bookingId: string, amount: number, paymentMethod: string) => {
    if (amount <= 0) {
      toast.error("Please enter a valid advance amount");
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current booking to check existing advance
      const { data: booking, error: fetchError } = await supabase
        .from('event_bookings')
        .select('advance_payment, bill_amount')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      const currentAdvance = booking.advance_payment || 0;
      const newAdvance = currentAdvance + amount;

      const { data, error } = await supabase
        .from('event_bookings')
        .update({
          advance_payment: newAdvance,
          payment_method: paymentMethod
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Advance payment of ₹${amount.toLocaleString()} added successfully!`);
      setIsAdvancePaymentOpen(false);
      setSelectedBooking(null);
      loadBookings();
      
    } catch (error: any) {
      console.error("Advance payment error:", error);
      toast.error(error.message || "Failed to add advance payment");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setGuest("");
    setType("Banquet Hall");
    setEmail("");
    setPhone("");
    setAttendees(50);
    setSpecialRequests("");
    setBookingDate(new Date());
    setStartHour("10");
    setDuration(4);
    setEnableGST(false);
    setGstin("");
    setCompanyName("");
    setBillingAddress("");
    setEnableAdvancePayment(false);
    setAdvancePayment(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Pending</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-blue-600">Confirmed</Badge>;
      case "ongoing":
        return <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse">Ongoing</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-blue-600">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeRemaining = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Started";
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''} to start`;
    }
    
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} to start`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Event Management</h1>
            <p className="text-gray-600 mt-2">Book and manage events with calendar scheduling</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={loadBookings}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ongoing</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.ongoing}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-100">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Advance Received</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₹{stats.totalAdvance.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Create Booking */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Calendar View */}
            <Card className="border-0 shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysInMonth.map((day, dayIdx) => {
                    const dayBookings = getBookingsForDate(day);
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <button
                        key={day.toString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        disabled={isPast(day) && !isToday(day)}
                        className={`
                          relative h-10 rounded-lg text-sm font-medium transition-all
                          ${isSelected 
                            ? 'bg-blue-600 text-white' 
                            : isToday(day)
                            ? 'bg-blue-100 text-blue-600'
                            : !isSameMonth(day, currentMonth)
                            ? 'text-gray-400 bg-gray-50'
                            : isPast(day) && !isToday(day)
                            ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        <time dateTime={format(day, 'yyyy-MM-dd')}>
                          {format(day, 'd')}
                        </time>
                        {dayBookings.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            {dayBookings.slice(0, 3).map(booking => (
                              <div 
                                key={booking.id}
                                className={`w-1 h-1 rounded-full ${
                                  booking.status === 'ongoing' ? 'bg-green-500' :
                                  booking.status === 'confirmed' ? 'bg-blue-500' :
                                  booking.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-400'
                                }`}
                              />
                            ))}
                            {dayBookings.length > 3 && (
                              <div className="w-1 h-1 rounded-full bg-gray-300" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  New Event Booking
                </CardTitle>
                <CardDescription>Schedule an event in advance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guest" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Guest Name *
                  </Label>
                  <Input
                    id="guest"
                    placeholder="John Doe"
                    value={guest}
                    onChange={(e) => setGuest(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={format(bookingDate, 'yyyy-MM-dd')}
                      onChange={(e) => setBookingDate(parseISO(e.target.value))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="border-gray-300 focus:border-blue-500 transition-colors"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time
                    </Label>
                    <Select value={startHour} onValueChange={setStartHour} disabled={isCreating}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {hours.map(hour => (
                          <SelectItem key={hour.value} value={hour.value}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Event Type
                    </Label>
                    <Select value={type} onValueChange={setType} disabled={isCreating}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{event.label}</div>
                                <div className="text-sm text-gray-500">₹{event.rate}/hour</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))} disabled={isCreating}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map(dur => (
                          <SelectItem key={dur.value} value={dur.value.toString()}>
                            {dur.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Estimated Attendees
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={attendees}
                    onChange={(e) => setAttendees(Number(e.target.value))}
                    className="border-gray-300 focus:border-blue-500 transition-colors"
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Contact Email *
                    </Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 transition-colors"
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Contact Phone *
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 transition-colors"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {/* GST Information Section */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      GST Invoice Required
                    </Label>
                    <Switch
                      checked={enableGST}
                      onCheckedChange={setEnableGST}
                      disabled={isCreating}
                    />
                  </div>
                  
                  {enableGST && (
                    <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">GSTIN *</Label>
                        <Input
                          placeholder="22AAAAA0000A1Z5"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          className="bg-white"
                          disabled={isCreating}
                        />
                        <p className="text-xs text-gray-500">15-digit GSTIN number</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Company Name</Label>
                        <Input
                          placeholder="Company Pvt. Ltd."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="bg-white"
                          disabled={isCreating}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Billing Address</Label>
                        <Textarea
                          placeholder="Complete billing address"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          className="min-h-[60px] bg-white"
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Advance Payment Section */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Collect Advance Payment
                    </Label>
                    <Switch
                      checked={enableAdvancePayment}
                      onCheckedChange={setEnableAdvancePayment}
                      disabled={isCreating}
                    />
                  </div>
                  
                  {enableAdvancePayment && (
                    <div className="space-y-2">
                      <Label>Advance Amount (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        max={calculateEstimatedAmount()}
                        value={advancePayment}
                        onChange={(e) => setAdvancePayment(Number(e.target.value))}
                        placeholder="Enter advance amount"
                        className="border-gray-300 focus:border-blue-500 transition-colors"
                        disabled={isCreating}
                      />
                      <p className="text-xs text-gray-500">
                        Max: ₹{calculateEstimatedAmount().toLocaleString()} ({duration} hours × ₹{rates[type as keyof typeof rates]}/hour)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Special Requests
                  </Label>
                  <Textarea
                    placeholder="Any special requirements, decorations, catering needs, etc."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="min-h-[80px] border-gray-300 focus:border-blue-500 transition-colors"
                    disabled={isCreating}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-sm text-gray-600">Estimated Amount</div>
                      <div className="text-2xl font-bold text-blue-700">
                        ₹{calculateEstimatedAmount().toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600">
                      {duration} hour{duration > 1 ? 's' : ''} × ₹{rates[type as keyof typeof rates]}/hour
                    </div>
                  </div>
                  
                  {enableAdvancePayment && advancePayment > 0 && (
                    <div className="pt-2 border-t border-blue-100">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Advance Payment</div>
                        <div className="text-lg font-semibold text-green-700">
                          - ₹{advancePayment.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-sm text-gray-600">Balance Payable</div>
                        <div className="text-lg font-bold text-blue-800">
                          ₹{(calculateEstimatedAmount() - advancePayment).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={createBooking} 
                  disabled={isCreating || !guest.trim() || !email.trim() || !phone.trim() || (enableGST && !gstin.trim())}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Book Event"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Right Column - Bookings List */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Event Bookings</CardTitle>
                    <CardDescription>
                      {stats.total} total bookings • {filteredBookings.length} shown
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ₹{stats.revenue.toLocaleString()} Revenue
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ₹{stats.totalAdvance.toLocaleString()} Advance
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-5 mb-6 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger 
                      value="all"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger 
                      value="upcoming"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <Calendar className="w-3 h-3 mr-2" />
                      Upcoming
                    </TabsTrigger>
                    <TabsTrigger 
                      value="ongoing"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <Clock className="w-3 h-3 mr-2" />
                      Ongoing
                    </TabsTrigger>
                    <TabsTrigger 
                      value="completed"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <CheckCheck className="w-3 h-3 mr-2" />
                      Completed
                    </TabsTrigger>
                    <TabsTrigger 
                      value="cancelled"
                      className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                    >
                      <XCircle className="w-3 h-3 mr-2" />
                      Cancelled
                    </TabsTrigger>
                  </TabsList>

                  {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Loading bookings...</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-gray-50">
                                <TableRow>
                                  <TableHead className="font-semibold">Guest</TableHead>
                                  <TableHead className="font-semibold">Event & Time</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  <TableHead className="font-semibold">Amount</TableHead>
                                  <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredBookings.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12">
                                      <div className="text-gray-500 space-y-2">
                                        <Calendar className="w-12 h-12 mx-auto opacity-50" />
                                        <p className="text-lg font-medium">No bookings found</p>
                                        <p className="text-sm">Try changing your filters or create a new booking</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredBookings.map((booking, index) => (
                                    <motion.tr
                                      key={booking.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3, delay: index * 0.05 }}
                                      className="hover:bg-gray-50/80 transition-colors group border-b border-gray-100 last:border-0"
                                    >
                                      <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                            {booking.guest_name.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900">{booking.guest_name}</div>
                                            {booking.contact_email && (
                                              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                                {booking.contact_email}
                                              </div>
                                            )}
                                            {booking.gstin && (
                                              <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                                <Shield className="w-3 h-3" />
                                                GST
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-4">
                                        <div>
                                          <div className="font-medium text-gray-900">{booking.event_type}</div>
                                          <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(booking.start_time), "dd MMM, HH:mm")}
                                            {booking.end_time && (
                                              <>
                                                <span className="mx-1">-</span>
                                                {format(new Date(booking.end_time), "HH:mm")}
                                              </>
                                            )}
                                          </div>
                                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                            <div className="text-xs text-blue-600 font-medium mt-1">
                                              {getTimeRemaining(booking.start_time)}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-4">
                                        <div className="transform transition-transform group-hover:scale-105">
                                          {getStatusBadge(booking.status)}
                                        </div>
                                        {booking.advance_payment && booking.advance_payment > 0 && (
                                          <div className="text-xs text-green-600 font-medium mt-1">
                                            ₹{booking.advance_payment.toLocaleString()} advance
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-4">
                                        {booking.bill_amount !== null ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                              <DollarSign className="w-4 h-4 text-green-600" />
                                              <span className="font-semibold text-green-700">
                                                ₹{booking.bill_amount.toLocaleString()}
                                              </span>
                                            </div>
                                            {booking.advance_payment && booking.advance_payment > 0 && (
                                              <div className="text-xs text-gray-500">
                                                After ₹{booking.advance_payment.toLocaleString()} advance
                                              </div>
                                            )}
                                          </div>
                                        ) : booking.duration_hours ? (
                                          <div className="text-gray-600">
                                            <div className="font-medium">
                                              ₹{(booking.duration_hours * rates[booking.event_type as keyof typeof rates]).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {booking.duration_hours} hour{booking.duration_hours > 1 ? 's' : ''}
                                            </div>
                                            {booking.advance_payment && booking.advance_payment > 0 && (
                                              <div className="text-xs text-green-600 font-medium mt-1">
                                                ₹{booking.advance_payment.toLocaleString()} paid
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 italic">--</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <MoreVertical className="w-4 h-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                              <DropdownMenuSeparator />
                                              {booking.status === "pending" && (
                                                <DropdownMenuItem 
                                                  onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsConfirmOpen(true);
                                                  }}
                                                  className="cursor-pointer"
                                                >
                                                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                                  Confirm Booking
                                                </DropdownMenuItem>
                                              )}
                                              {booking.status === "confirmed" && (
                                                <>
                                                  <DropdownMenuItem 
                                                    onClick={() => {
                                                      setSelectedBooking(booking);
                                                      setIsCheckinOpen(true);
                                                    }}
                                                    className="cursor-pointer"
                                                  >
                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                                    Check-in
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem 
                                                    onClick={() => {
                                                      setSelectedBooking(booking);
                                                      setIsAdvancePaymentOpen(true);
                                                    }}
                                                    className="cursor-pointer"
                                                  >
                                                    <DollarSign className="w-4 h-4 mr-2 text-amber-600" />
                                                    Add Advance Payment
                                                  </DropdownMenuItem>
                                                </>
                                              )}
                                              {booking.status === "ongoing" && (
                                                <DropdownMenuItem 
                                                  onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsCheckoutOpen(true);
                                                  }}
                                                  className="cursor-pointer"
                                                >
                                                  <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                                                  Checkout
                                                </DropdownMenuItem>
                                              )}
                                              {(booking.status === "pending" || booking.status === "confirmed" || booking.status === "ongoing") && (
                                                <DropdownMenuItem 
                                                  onClick={() => cancelBooking(booking.id)}
                                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                                >
                                                  <XCircle className="w-4 h-4 mr-2" />
                                                  Cancel
                                                </DropdownMenuItem>
                                              )}
                                              <DropdownMenuItem 
                                                onClick={() => {
                                                  setSelectedBooking(booking);
                                                  setIsDetailsOpen(true);
                                                }}
                                                className="cursor-pointer"
                                              >
                                                <Calendar className="w-4 h-4 mr-2" />
                                                View Details
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Guest Name</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedBooking.guest_name}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Event Type</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {selectedBooking.event_type}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Rate/Hour</Label>
                    <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium">
                      ₹{rates[selectedBooking.event_type as keyof typeof rates] || 2000}
                    </div>
                  </div>
                  {selectedBooking.estimated_attendees && (
                    <div>
                      <Label className="text-gray-500 text-sm">Estimated Attendees</Label>
                      <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {selectedBooking.estimated_attendees} people
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Timing</Label>
                    <div className="mt-1 space-y-2">
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-500">Start Time</div>
                        <div className="font-medium">
                          {format(new Date(selectedBooking.start_time), "dd MMM yyyy, HH:mm")}
                        </div>
                      </div>
                      {selectedBooking.end_time && (
                        <div className="p-3 border rounded-lg">
                          <div className="text-sm text-gray-500">End Time</div>
                          <div className="font-medium">
                            {format(new Date(selectedBooking.end_time), "dd MMM yyyy, HH:mm")}
                          </div>
                        </div>
                      )}
                      {selectedBooking.duration_hours && (
                        <div className="p-3 border rounded-lg">
                          <div className="text-sm text-gray-500">Duration</div>
                          <div className="font-medium">
                            {selectedBooking.duration_hours} hour{selectedBooking.duration_hours > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Status</Label>
                    <div className="mt-2">
                      {getStatusBadge(selectedBooking.status)}
                    </div>
                  </div>
                  {selectedBooking.created_at && (
                    <div>
                      <Label className="text-gray-500 text-sm">Created At</Label>
                      <div className="mt-1 p-2 border rounded">
                        {format(new Date(selectedBooking.created_at), "dd MMM yyyy, HH:mm")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GST Information Section */}
              {(selectedBooking.gstin || selectedBooking.company_name) && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">GST Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBooking.gstin && (
                      <div>
                        <Label className="text-gray-600 text-sm">GSTIN</Label>
                        <div className="font-medium text-gray-900">{selectedBooking.gstin}</div>
                      </div>
                    )}
                    {selectedBooking.company_name && (
                      <div>
                        <Label className="text-gray-600 text-sm">Company Name</Label>
                        <div className="font-medium text-gray-900">{selectedBooking.company_name}</div>
                      </div>
                    )}
                    {selectedBooking.billing_address && (
                      <div className="col-span-2">
                        <Label className="text-gray-600 text-sm">Billing Address</Label>
                        <div className="font-medium text-gray-900">{selectedBooking.billing_address}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedBooking.contact_email || selectedBooking.contact_phone) && (
                <div>
                  <Label className="text-gray-500 text-sm">Contact Information</Label>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    {selectedBooking.contact_email && (
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {selectedBooking.contact_email}
                        </div>
                      </div>
                    )}
                    {selectedBooking.contact_phone && (
                      <div className="p-3 border rounded-lg">
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedBooking.contact_phone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedBooking.special_requests && (
                <div>
                  <Label className="text-gray-500 text-sm">Special Requests</Label>
                  <div className="mt-1 p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="whitespace-pre-wrap">{selectedBooking.special_requests}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.bill_amount !== null ? (
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Base Amount</div>
                      <div className="text-xl font-bold text-green-800">
                        ₹{((selectedBooking.bill_amount + (selectedBooking.advance_payment || 0)) - (selectedBooking.extra_charge || 0)).toLocaleString()}
                      </div>
                    </div>
                    {selectedBooking.advance_payment && selectedBooking.advance_payment > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">Advance Payment</div>
                        <div className="text-lg font-semibold text-blue-800">
                          - ₹{selectedBooking.advance_payment.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedBooking.extra_charge > 0 && (
                      <div>
                        <div className="text-sm text-gray-600">Extra Charges</div>
                        <div className="text-lg font-semibold text-green-800">
                          ₹{selectedBooking.extra_charge.toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div className="col-span-2 border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-gray-900">Final Amount</div>
                        <div className="text-2xl font-bold text-green-800">
                          ₹{selectedBooking.bill_amount.toLocaleString()}
                        </div>
                      </div>
                      {selectedBooking.payment_method && (
                        <div className="text-sm text-gray-600 mt-2">
                          Paid via {selectedBooking.payment_method}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedBooking.advance_payment && selectedBooking.advance_payment > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600">Advance Payment Received</div>
                      <div className="text-2xl font-bold text-blue-800">
                        ₹{selectedBooking.advance_payment.toLocaleString()}
                      </div>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Booking Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Confirm Booking
            </DialogTitle>
            <DialogDescription>
              Confirm booking for {selectedBooking?.guest_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type</Label>
                <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium">
                  {selectedBooking?.event_type}
                </div>
              </div>
              <div>
                <Label>Date & Time</Label>
                <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium">
                  {selectedBooking && format(new Date(selectedBooking.start_time), "dd MMM, HH:mm")}
                </div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Booking will be marked as confirmed</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => confirmBooking(selectedBooking!.id)}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={isCheckinOpen} onOpenChange={setIsCheckinOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Check-in Guest
            </DialogTitle>
            <DialogDescription>
              Start event for {selectedBooking?.guest_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Type</Label>
                <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium">
                  {selectedBooking?.event_type}
                </div>
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <div className="mt-1 p-3 border rounded-lg bg-gray-50 font-medium">
                  {selectedBooking && format(new Date(selectedBooking.start_time), "dd MMM, HH:mm")}
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-800">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Event will be marked as ongoing</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCheckinOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => checkin(selectedBooking!.id)}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Start Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Checkout
            </DialogTitle>
            <DialogDescription>
              Complete checkout for {selectedBooking?.guest_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg font-medium">
                  {selectedBooking && Math.max(1, Math.ceil(differenceInHours(new Date(), new Date(selectedBooking.start_time)) / 1) * 1)} hours
                </div>
              </div>
              <div>
                <Label>Base Rate</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg font-medium">
                  ₹{selectedBooking && rates[selectedBooking.event_type as keyof typeof rates]}/hour
                </div>
              </div>
            </div>

            {selectedBooking?.advance_payment && selectedBooking.advance_payment > 0 && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-600">Advance Payment</div>
                    <div className="text-lg font-bold text-blue-700">
                      ₹{selectedBooking.advance_payment.toLocaleString()}
                    </div>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm text-blue-600">
                  Will be deducted from final bill
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="extra">Extra Charges (₹)</Label>
              <Input
                id="extra"
                type="number"
                value={extraCharge}
                onChange={(e) => setExtraCharge(Number(e.target.value))}
                placeholder="0"
                className="rounded-lg"
                min="0"
              />
              <p className="text-sm text-gray-500">Add any additional charges here</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Base Amount:</span>
                  <span className="font-medium">
                    ₹{selectedBooking ? (
                      (Math.max(1, Math.ceil(differenceInHours(new Date(), new Date(selectedBooking.start_time)) / 1) * 1) * 
                      rates[selectedBooking.event_type as keyof typeof rates]).toLocaleString()
                    ) : 0}
                  </span>
                </div>
                
                {selectedBooking?.advance_payment && selectedBooking.advance_payment > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Advance Payment:</span>
                    <span className="font-medium text-blue-700">
                      - ₹{selectedBooking.advance_payment.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {extraCharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Extra Charges:</span>
                    <span className="font-medium">+ ₹{extraCharge.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-900">Final Amount:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      ₹{selectedBooking ? (
                        Math.max(0, (
                          (Math.max(1, Math.ceil(differenceInHours(new Date(), new Date(selectedBooking.start_time)) / 1) * 1) * 
                          rates[selectedBooking.event_type as keyof typeof rates]) + 
                          extraCharge - 
                          (selectedBooking.advance_payment || 0)
                        )).toLocaleString()
                      ) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCheckoutOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={checkout}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Complete Checkout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advance Payment Dialog */}
      <Dialog open={isAdvancePaymentOpen} onOpenChange={setIsAdvancePaymentOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              Add Advance Payment
            </DialogTitle>
            <DialogDescription>
              Add advance payment for {selectedBooking?.guest_name}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Event Type</div>
                    <div className="font-medium">{selectedBooking.event_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Current Advance</div>
                    <div className="font-medium text-amber-700">
                      ₹{(selectedBooking.advance_payment || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Advance Amount (₹)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  className="rounded-lg"
                />
                <p className="text-sm text-gray-500">
                  Amount will be added to existing advance payment
                </p>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">Total Advance After Payment</div>
                    <div className="text-2xl font-bold text-amber-700">
                      ₹{((selectedBooking.advance_payment || 0) + advancePayment).toLocaleString()}
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-amber-600" />
                </div>
              </motion.div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAdvancePaymentOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => addAdvancePayment(selectedBooking!.id, advancePayment, paymentMethod)}
              disabled={isLoading || advancePayment <= 0}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Advance Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}