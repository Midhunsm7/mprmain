"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  IndianRupee,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

import CalendarPanel from "./components/CalendarPanel";
import RoomGrid, { Room } from "./components/RoomGrid";
import BookingPanel from "./components/BookingPanel";
import CheckInDialog from "./components/CheckInDialog";
import GuestList from "./components/GuestList";
import HousekeepingList from "./components/HousekeepingList";
import MaintenancePanel from "./components/MaintenancePanel";

const HOURLY_LATE_FEE = 200;

/* ================= TYPES =================== */

interface RawRoom {
  id: string;
  room_number: string;
  status: string;
  room_types: {
    name: string;
    base_price: number;
  } | null;
  current_guest_id?: string | null;
}

interface RawGuest {
  id: string;
  name: string;
  room_ids: string[];
  check_in: string;
  booked_days: number;
  base_amount: number;
  status: "checked-in" | "checked-out";
  check_out?: string;
  extra_hours?: number;
  extra_charge?: number;
  total_charge?: number;
  room_pin?: string; // PIN field from database
  pin_code?: string; // Alternative PIN field
  purpose_of_visit?: string;
}

export interface Guest {
  id: string;
  name: string;
  roomIds: string[];
  checkInISO: string;
  bookedDays: number;
  baseAmount: number;
  status: "checked-in" | "checked-out";
  checkOutISO?: string;
  extraHours?: number;
  extraCharge?: number;
  totalCharge?: number;
  roomPin?: string;
  purposeOfVisit?: string;
}

/* =========================================== */

export default function BookingsPage() {
  const router = useRouter();

  const [selectedDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [days, setDays] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  /* ===================================================== */
  /* ================= FETCH ROOMS ====================== */
  /* ===================================================== */

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("rooms").select(`
        id, 
        room_number, 
        status, 
        current_guest_id,
        room_types(name, base_price)
      `);

      if (error) {
        console.error("Room fetch error:", error);
        setRooms([]);
        return;
      }

      await fetchGuests(data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    roomId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .update({ status: newStatus })
        .eq("id", roomId);

      if (error) {
        console.error("Error updating room status:", error);
        alert("Failed to update room status");
        return;
      }

      // Remove from selectedRooms if maintenance
      if (newStatus === "maintenance") {
        setSelectedRooms((prev) => prev.filter((r) => r.id !== roomId));
      }

      fetchRooms();
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to update room status");
    }
  };

  /* ===================================================== */
  /* ================= FETCH GUESTS ===================== */
  /* ===================================================== */

  const fetchGuests = async (roomsData: RawRoom[] = []) => {
    try {
      const { data: guestsData, error: guestsError } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (guestsError) {
        console.error("Guest fetch error:", guestsError);
        return;
      }

      // Map guests with PINs
      const mappedGuests: Guest[] = (guestsData || []).map((g: RawGuest) => ({
        id: g.id,
        name: g.name,
        roomIds: g.room_ids || [],
        checkInISO: g.check_in,
        bookedDays: g.booked_days,
        baseAmount: g.base_amount,
        status: g.status,
        checkOutISO: g.check_out,
        extraHours: g.extra_hours,
        extraCharge: g.extra_charge,
        totalCharge: g.total_charge,
        roomPin: g.room_pin || g.pin_code || undefined,
        purposeOfVisit: g.purpose_of_visit || "leisure",
      }));

      setGuests(mappedGuests);

      // Get checked-in guests for occupancy check
      const checkedInGuests = mappedGuests.filter(g => g.status === "checked-in");
      
      // Map rooms with proper status determination
      const mappedRooms: Room[] = (roomsData || []).map((r: RawRoom) => {
        // Clean up status string
        const rawStatus = (r.status || "").toLowerCase().trim();
        
        // Check if room is occupied by a checked-in guest
        const isOccupied = checkedInGuests.some(g => 
          g.roomIds?.includes(r.id) || r.current_guest_id === g.id
        );
        
        // Determine actual status
        let roomStatus: Room["status"];
        
        if (isOccupied) {
          roomStatus = "occupied";
        } else if (rawStatus.includes("maintenance") || rawStatus.includes("ooo")) {
          roomStatus = "maintenance";
        } else if (rawStatus.includes("housekeeping") || rawStatus.includes("dirty") || rawStatus.includes("v&d")) {
          roomStatus = "housekeeping";
        } else if (rawStatus.includes("free") || rawStatus.includes("available") || rawStatus.includes("v&c")) {
          roomStatus = "free";
        } else if (rawStatus.includes("occupied") || rawStatus.includes("occ")) {
          roomStatus = "occupied";
        } else {
          // Default to free if we can't determine
          roomStatus = "free";
        }
        
        // Find guest for PIN if room is occupied
        const guest = isOccupied ? checkedInGuests.find(g => 
          g.roomIds?.includes(r.id) || r.current_guest_id === g.id
        ) : null;

        return {
          id: r.id,
          name: r.room_number,
          category: r.room_types?.name ?? "Deluxe",
          status: roomStatus,
          pricePerDay: r.room_types?.base_price ?? 2800,
          guestId: guest?.id || null,
          pin: guest?.roomPin || null,
          current_guest_id: r.current_guest_id,
        };
      });

      console.log("Mapped rooms:", mappedRooms.map(r => ({
        name: r.name,
        status: r.status,
        guestId: r.guestId
      })));

      setRooms(mappedRooms);
    } catch (error) {
      console.error("Error fetching guests:", error);
      setGuests([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  /* ===================== PIN FUNCTIONS ===================== */

  const togglePinVisibility = (roomId: string) => {
    setShowPins((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const copyPinToClipboard = async (pin: string, roomId: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(roomId);
      setTimeout(() => setCopiedPin(null), 2000);
    } catch (err) {
      console.error("Failed to copy PIN:", err);
    }
  };

  /* ===================== CALCULATIONS ===================== */

  const calculateTotal = () => {
    return selectedRooms.reduce((sum, r) => sum + (r.pricePerDay || 0), 0) * days;
  };

  const handleRoomClick = (room: Room) => {
    if (room.status !== "free") return;

    setSelectedRooms((prev) =>
      prev.find((r) => r.id === room.id)
        ? prev.filter((r) => r.id !== room.id)
        : [...prev, room]
    );
  };

  // Add this new function for handling multiple room selection
  const handleSelectionChange = (rooms: Room[]) => {
    // Filter to only free rooms
    const freeRooms = rooms.filter((room) => room.status === "free");
    setSelectedRooms(freeRooms);
  };

  const handleConfirmBooking = async (data: any) => {
    if (selectedRooms.length === 0) return;

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: data.address,
          idProof: data.idProof,
          room_id: selectedRooms[0].id,
          days: data.days,
          pax: data.pax,
          mealPlan: data.mealPlan,
          mealPlanCharge: data.mealPlanCharge,
          guestCategory: data.guestCategory,
          gstin: data.gstin,
          companyName: data.companyName,
          purposeOfVisit: data.purposeOfVisit,
          advanceAmount: data.advanceAmount,
          bookingType: data.bookingType,
          hours: data.hours,
          manualPrice: data.manualPrice,
          totalAmount: data.totalAmount,
          calculatedTotal: calculateTotal()
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Check-in failed");
        return;
      }

      setSelectedRooms([]);
      setBookingOpen(false);

      alert(
        `Check-in successful!\n\n` +
        `Guest: ${data.name}\n` +
        `Room PIN: ${result.room_pin}\n` +
        `Total Amount: ₹${result.total_amount}\n` +
        `Advance Paid: ₹${result.advance_paid}\n` +
        `Balance Due: ₹${result.balance_due}\n\n` +
        `Please share the PIN with the guest.`
      );

      fetchRooms();
      
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  const hourDiff = (iso: string) => {
    const start = new Date(iso).getTime();
    const now = Date.now();
    return Math.ceil((now - start) / (1000 * 60 * 60));
  };

  const handleCheckOut = async (guest: Guest) => {
    const hoursStayed = hourDiff(guest.checkInISO);
    const bookedHours = guest.bookedDays * 24;

    const extraHours = Math.max(0, hoursStayed - bookedHours);
    const extraCharge = extraHours * HOURLY_LATE_FEE;
    
    // Check if guest was complimentary
    const guestRecord = await supabase
      .from("guests")
      .select("guest_category, base_amount")
      .eq("id", guest.id)
      .single();
    
    let totalCharge;
    if (guestRecord.data?.guest_category === "complimentary" || guest.baseAmount === 0) {
      // For complimentary guests, only charge extra hours if applicable
      totalCharge = extraCharge;
    } else {
      totalCharge = guest.baseAmount + extraCharge;
    }

    // Update rooms to housekeeping and clear guest ID
    await supabase
      .from("rooms")
      .update({
        status: "housekeeping",
        current_guest_id: null,
      })
      .in("id", guest.roomIds);

    // Update guest record
    await supabase
      .from("guests")
      .update({
        status: "checked-out",
        check_out: new Date().toISOString(),
        extra_hours: extraHours,
        extra_charge: extraCharge,
        total_charge: totalCharge,
        room_pin: null, // Clear PIN on checkout
        pin_code: null,
      })
      .eq("id", guest.id);

    fetchRooms();
    
    // Show appropriate checkout message
    if (guestRecord.data?.guest_category === "complimentary" || guest.baseAmount === 0) {
      if (extraHours > 0) {
        alert(`Guest checked out!\n\nComplimentary Stay\nExtra hours: ${extraHours}\nExtra charge: ₹${extraCharge}\nTotal: ₹${totalCharge}`);
      } else {
        alert(`Guest checked out!\n\nComplimentary Stay - No charges`);
      }
    } else {
      alert(`Guest checked out!\n\nBase amount: ₹${guest.baseAmount}\nExtra hours: ${extraHours}\nExtra charge: ₹${extraCharge}\nTotal: ₹${totalCharge}`);
    }
  };

  const markRoomCleaned = async (roomId: string) => {
    await supabase
      .from("rooms")
      .update({
        status: "available",
        current_guest_id: null,
      })
      .eq("id", roomId);
    fetchRooms();
  };

  const occupiedGuests = useMemo(
    () => guests.filter((g) => g.status === "checked-in"),
    [guests]
  );

  // Quick stats for header
  const availableRooms = rooms.filter((r) => r.status === "free").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const housekeepingRooms = rooms.filter((r) => r.status === "housekeeping").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "maintenance").length;
  const totalRooms = rooms.length;

  /* ===================== ENHANCED GUEST LIST WITH PINS ===================== */

  const EnhancedGuestList = ({
    guests,
    onCheckout,
  }: {
    guests: Guest[];
    onCheckout: (guest: Guest) => void;
  }) => {
    const [showGuestPins, setShowGuestPins] = useState<Record<string, boolean>>(
      {}
    );

    const toggleGuestPin = (guestId: string) => {
      setShowGuestPins((prev) => ({
        ...prev,
        [guestId]: !prev[guestId],
      }));
    };

    const copyGuestPin = async (pin: string, guestId: string) => {
      try {
        await navigator.clipboard.writeText(pin);
        alert("PIN copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy PIN:", err);
      }
    };

    return (
      <div className="space-y-3">
        {guests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No guests currently checked in
          </div>
        ) : (
          guests.map((guest) => {
            const guestRooms = rooms.filter((r) => r.guestId === guest.id);
            const displayPin = showGuestPins[guest.id] ? guest.roomPin : "••••";

            return (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{guest.name}</h4>
                    <p className="text-sm text-slate-600">
                      Rooms: {guestRooms.map((r) => r.name).join(", ")}
                    </p>
                  </div>
                  <button
                    onClick={() => onCheckout(guest)}
                    className="px-3 py-1 bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 rounded-xl text-sm font-medium hover:from-rose-100 hover:to-pink-100 transition-all"
                  >
                    Checkout
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-700">
                        Room PIN:
                      </span>
                      <span
                        className={`font-mono text-sm ${
                          showGuestPins[guest.id]
                            ? "text-blue-700"
                            : "text-slate-500"
                        }`}
                      >
                        {displayPin}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleGuestPin(guest.id)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        title={
                          showGuestPins[guest.id] ? "Hide PIN" : "Show PIN"
                        }
                      >
                        {showGuestPins[guest.id] ? (
                          <EyeOff className="h-4 w-4 text-slate-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                      {guest.roomPin && showGuestPins[guest.id] && (
                        <button
                          onClick={() => copyGuestPin(guest.roomPin!, guest.id)}
                          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Copy PIN"
                        >
                          <Copy className="h-4 w-4 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Checked in:{" "}
                    {new Date(guest.checkInISO).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    );
  };

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/20 p-4 lg:p-6 space-y-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6 lg:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Resort Bookings
                </h1>
                <p className="text-slate-600 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Real-time room management with PIN access
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-center">
              <div className="bg-blue-50 rounded-2xl px-4 py-2 border border-blue-200">
                <div className="text-lg font-bold text-blue-700">
                  {availableRooms}
                </div>
                <div className="text-xs text-blue-600">Available</div>
              </div>
              <div className="bg-rose-50 rounded-2xl px-4 py-2 border border-rose-200">
                <div className="text-lg font-bold text-rose-700">
                  {occupiedRooms}
                </div>
                <div className="text-xs text-rose-600">Occupied</div>
              </div>
              <div className="bg-yellow-50 rounded-2xl px-4 py-2 border border-yellow-200">
                <div className="text-lg font-bold text-yellow-700">
                  {housekeepingRooms}
                </div>
                <div className="text-xs text-yellow-600">Housekeeping</div>
              </div>
              <div className="bg-amber-50 rounded-2xl px-4 py-2 border border-amber-200">
                <div className="text-lg font-bold text-amber-700">
                  {maintenanceRooms}
                </div>
                <div className="text-xs text-amber-600">Maintenance</div>
              </div>
              <div className="bg-emerald-50 rounded-2xl px-4 py-2 border border-emerald-200">
                <div className="text-lg font-bold text-emerald-700">
                  {occupiedGuests.length}
                </div>
                <div className="text-xs text-emerald-600">Guests</div>
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-2 border border-slate-200">
                <div className="text-lg font-bold text-slate-700">
                  {totalRooms}
                </div>
                <div className="text-xs text-slate-600">Total</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Debug Stats - Remove after testing */}
        <div className="mt-4 p-3 bg-slate-100 rounded-xl border border-slate-200">
          <div className="text-sm text-slate-700">
            <div className="font-semibold mb-1">Room Status Breakdown:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>Free: {availableRooms} rooms</div>
              <div>Occupied: {occupiedRooms} rooms</div>
              <div>Housekeeping: {housekeepingRooms} rooms</div>
              <div>Maintenance: {maintenanceRooms} rooms</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6 mt-6"
        >
          {/* LEFT SIDEBAR */}
          <div className="xl:col-span-1 space-y-4 lg:space-y-6">
            {/* Calendar Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Calendar</h3>
              </div>
              <CalendarPanel selectedDate={selectedDate} onChange={() => {}} />
            </motion.div>

            {/* Booking Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Quick Booking</h3>
              </div>
              <BookingPanel
                selectedRooms={selectedRooms}
                total={calculateTotal()}
                days={days}
                setDays={setDays}
                onBook={() => setBookingOpen(true)}
                onCheckout={() => router.push("/checkout")}
              />
            </motion.div>

            {/* PIN Management Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">PIN Management</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  <p>
                    Each booked room gets a unique 4-digit PIN for guest access.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Show All PINs
                    </span>
                    <button
                      onClick={() => {
                        const newShowPins: Record<string, boolean> = {};
                        rooms.forEach((room) => {
                          if (room.pin) newShowPins[room.id] = true;
                        });
                        setShowPins(newShowPins);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all"
                    >
                      Show All
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  PINs are automatically generated and can be viewed by staff
                </div>
              </div>
            </motion.div>
          </div>

          {/* CENTER — ROOM GRID */}
          <div className="xl:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6 h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">
                    Room Availability
                  </h2>
                  <p className="text-slate-600 text-sm lg:text-base">
                    {selectedRooms.length > 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                          {selectedRooms.length} room(s) selected
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <IndianRupee className="w-4 h-4" />
                          {calculateTotal()} total
                        </span>
                      </span>
                    ) : (
                      "Click on available rooms to select"
                    )}
                  </p>
                </div>

                {selectedRooms.length > 0 && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setBookingOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <RoomGrid
                  rooms={rooms}
                  selectedRooms={selectedRooms}
                  guests={occupiedGuests.map((g) => ({
                    id: g.id,
                    name: g.name,
                    status: g.status,
                    room_ids: g.roomIds,
                  }))}
                  onRoomClick={handleRoomClick}
                  onSelectionChange={handleSelectionChange}
                  onStatusChange={handleStatusChange}
                />
              )}
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="xl:col-span-1 space-y-4 lg:space-y-6">
            {/* Guest List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">Current Guests</h3>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {occupiedGuests.length}
                </span>
              </div>
              <div className="h-80 lg:h-96 overflow-hidden flex flex-col">
                <EnhancedGuestList
                  guests={occupiedGuests}
                  onCheckout={handleCheckOut}
                />
              </div>
            </motion.div>

            {/* Housekeeping List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <div className="h-64 lg:h-72 overflow-hidden flex flex-col">
                <HousekeepingList
                  rooms={rooms}
                  onMarkCleaned={markRoomCleaned}
                />
              </div>
            </motion.div>

            {/* Maintenance Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-slate-200/60 p-6"
            >
              <MaintenancePanel rooms={rooms} refreshRooms={fetchRooms} />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* CHECK-IN DIALOG */}
      <CheckInDialog
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onConfirm={handleConfirmBooking}
        calculatedTotal={calculateTotal()}
      />
    </div>
  );
}