"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, UserIcon, PhoneIcon, HomeIcon, CreditCardIcon, CalendarCheckIcon } from "lucide-react";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/* Helper: Get existing guest by phone OR create new one                */
/* ------------------------------------------------------------------ */
async function getOrCreateGuest(
  supabase: any,
  guestName: string,
  phone: string
) {
  // Clean phone number by removing +91, spaces, and ensuring proper format
  const cleanedPhone = cleanPhoneNumber(phone);
  
  // 1️⃣ Try to find existing guest with cleaned phone
  const { data: existingGuest } = await supabase
    .from("guests")
    .select("id")
    .eq("phone", cleanedPhone)
    .maybeSingle();

  if (existingGuest) {
    return existingGuest;
  }

  // 2️⃣ Create new guest if not found - use valid status from schema
  const { data: newGuest, error } = await supabase
    .from("guests")
    .insert({
      name: guestName,
      phone: cleanedPhone, // Use cleaned phone number
      status: "checked-in", // Changed from "booked" to match schema
    })
    .select("id")
    .single();

  if (error) throw error;
  return newGuest;
}

// Clean phone number for Indian format
function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0, keep it (Indian local format)
  if (cleaned.startsWith('0')) {
    // Ensure it's exactly 10 digits (with leading 0)
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return cleaned; // e.g., 09876543210
    } else if (cleaned.length === 10) {
      return '0' + cleaned; // Add leading 0 if missing
    }
  }
  
  // If it starts with 91 (country code without +)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '0' + cleaned.substring(2); // Convert 919876543210 to 09876543210
  }
  
  // If it starts with +91
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '0' + cleaned.substring(2); // Convert 919876543210 to 09876543210
  }
  
  // If it's 10 digits without leading 0
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return '0' + cleaned; // Add leading 0
  }
  
  // If it's 11 digits with leading 0, keep as is
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned;
  }
  
  // Return original if doesn't match expected patterns
  return phone;
}

// Format phone for display
function formatPhoneForDisplay(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Format as 0XXXX-XXXXXX
    return `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  
  return phone;
}

// Simple toast function replacement
function showToast(title: string, description: string, type: "success" | "error" = "success") {
  console.log(`${type.toUpperCase()}: ${title} - ${description}`);
  if (typeof window !== 'undefined') {
    alert(`${title}: ${description}`);
  }
}

// Calculate total nights
function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function AdvanceBookingPage() {
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [roomId, setRoomId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<any>(null);
  const [totalNights, setTotalNights] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState("");

  /* ------------------------------------------------------------------ */
  /* Load available rooms with room type details                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    loadRooms();
  }, []);

  // Update total nights when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      const nights = calculateNights(checkIn, checkOut);
      setTotalNights(nights);
      
      // Calculate total amount
      if (selectedRoomDetails && selectedRoomDetails.price_per_night) {
        setTotalAmount(nights * selectedRoomDetails.price_per_night);
      }
    }
  }, [checkIn, checkOut, selectedRoomDetails]);

  // Update selected room details
  useEffect(() => {
    if (roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === roomId);
      setSelectedRoomDetails(room);
      
      if (checkIn && checkOut && room?.price_per_night) {
        const nights = calculateNights(checkIn, checkOut);
        setTotalAmount(nights * room.price_per_night);
      }
    } else {
      setSelectedRoomDetails(null);
      setTotalAmount(0);
    }
  }, [roomId, rooms, checkIn, checkOut]);

  // Format phone for display as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setPhone(input);
    
    // Format for display
    const formatted = formatPhoneForDisplay(input);
    setFormattedPhone(formatted !== input ? formatted : "");
  };

  async function loadRooms() {
    try {
      setRoomsLoading(true);
      
      // Query with proper syntax and join room_types
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          status,
          room_types (
            name,
            base_price,
            max_occupancy
          )
        `)
        .eq("status", "available")  // Note: single quotes in SQL, but here it's JavaScript string

      if (error) {
        console.error("Error loading rooms:", error);
        showToast("Error", `Could not fetch available rooms: ${error.message}`, "error");
        return;
      }

      // Transform data to include room type details
      const formattedRooms = data?.map(room => ({
        id: room.id,
        room_number: room.room_number,
        room_type: room.room_types?.name || "Unknown",
        price_per_night: room.room_types?.base_price || 0,
        max_occupancy: room.room_types?.max_occupancy || 1,
        status: room.status
      })) || [];

      setRooms(formattedRooms);
      
    } catch (err) {
      console.error("Failed to load rooms:", err);
      showToast("Error", "Failed to load rooms. Check console for details.", "error");
    } finally {
      setRoomsLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Create advance booking                                              */
  /* ------------------------------------------------------------------ */
  async function createAdvanceBooking() {
    // Validation
    if (!guestName || !phone || !checkIn || !checkOut || !roomId) {
      showToast("Missing fields", "Please fill all required fields", "error");
      return;
    }

    // Phone validation
    const cleanedPhone = cleanPhoneNumber(phone);
    if (cleanedPhone.length !== 11 || !cleanedPhone.startsWith('0')) {
      showToast("Invalid Phone", "Please enter a valid 10-digit Indian phone number with leading 0", "error");
      return;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(checkIn);
    
    if (checkInDate < today) {
      showToast("Invalid Date", "Check-in date cannot be in the past", "error");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      showToast("Invalid Dates", "Check-out must be after check-in", "error");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Get or create guest
      let guest;
      try {
        guest = await getOrCreateGuest(supabase, guestName, phone);
      } catch (err: any) {
        showToast("Guest error", `Unable to create/fetch guest: ${err.message}`, "error");
        return;
      }

      // Calculate base amount
      const nights = calculateNights(checkIn, checkOut);
      const baseAmount = selectedRoomDetails?.price_per_night ? nights * selectedRoomDetails.price_per_night : 0;

      // 2️⃣ Create advance booking with proper status
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          guest_id: guest.id,
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          base_amount: baseAmount,
          status: "booked",  // Changed from "pending" to "booked" to match schema
          booking_type: "advance",
          advance_amount: advanceAmount,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (bookingErr) {
        throw new Error(`Booking failed: ${bookingErr.message}`);
      }

      // 3️⃣ Save advance payment (if any)
      if (advanceAmount > 0) {
        const { error: paymentErr } = await supabase
          .from("payments")
          .insert({
            booking_id: booking.id,
            guest_id: guest.id,
            amount: advanceAmount,
            method: paymentMethod,
            payment_mode: paymentMethod, // Add payment_mode field
            status: "paid",
            created_at: new Date().toISOString(),
          });

        if (paymentErr) {
          throw new Error(`Payment error: ${paymentErr.message}`);
        }
      }

      // 4️⃣ Update room status to "reserved" (not in schema but logical)
      const { error: roomUpdateErr } = await supabase
        .from("rooms")
        .update({ 
          status: "reserved",
          current_guest_id: guest.id 
        })
        .eq("id", roomId);

      if (roomUpdateErr) {
        console.warn("Room status update failed:", roomUpdateErr.message);
        // Continue anyway - room might not have 'reserved' status
      }

      showToast("Success", "Advance booking created successfully", "success");

      // Reset form
      setGuestName("");
      setPhone("");
      setFormattedPhone("");
      setCheckIn("");
      setCheckOut("");
      setRoomId("");
      setAdvanceAmount(0);
      setPaymentMethod("cash");
      setSelectedRoomDetails(null);
      setTotalNights(0);
      setTotalAmount(0);
      
      // Reload available rooms
      loadRooms();

    } catch (error: any) {
      showToast("Error", error.message || "Failed to create booking", "error");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advance Room Booking</h1>
          <p className="text-gray-600 mt-2">Secure your stay in advance with easy booking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CalendarCheckIcon className="h-6 w-6" />
                  Booking Details
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Fill in guest information and booking dates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Guest Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    Guest Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestName" className="text-gray-700">
                        Full Name *
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="guestName"
                          placeholder="Enter guest name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700">
                        Phone Number *
                      </Label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="09876 543210"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="pl-10"
                          required
                          pattern="[0-9\s\-+]*"
                          title="Enter 10-digit Indian phone number"
                        />
                      </div>
                      {formattedPhone && (
                        <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          Formatted: <span className="font-medium">{formattedPhone}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Enter 10-digit Indian number (e.g., 09876 543210, 9876543210, or +91 9876543210)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Booking Dates
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700">Check-in Date *</Label>
                      <Input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full"
                        min={format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700">Check-out Date *</Label>
                      <Input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full"
                        min={checkIn || format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                  </div>
                  
                  {checkIn && checkOut && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                      <span className="font-semibold">Stay Duration:</span> {totalNights} night{totalNights !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Room Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HomeIcon className="h-5 w-5 text-blue-600" />
                    Room Selection
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-gray-700">
                      Select Room *
                    </Label>
                    <Select value={roomId} onValueChange={setRoomId} disabled={roomsLoading}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          roomsLoading ? "Loading rooms..." : "Choose a room"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            <div className="flex justify-between items-center w-full">
                              <div>
                                <span className="font-medium">Room {room.room_number}</span>
                                <span className="text-sm text-gray-500 ml-2">({room.room_type})</span>
                              </div>
                              <span className="text-sm font-semibold text-blue-600">
                                ₹{room.price_per_night}/night
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {roomsLoading ? (
                    <div className="text-sm text-blue-600 italic">
                      Loading available rooms...
                    </div>
                  ) : rooms.length === 0 ? (
                    <div className="text-sm text-gray-500 italic">
                      No available rooms at the moment
                    </div>
                  ) : null}
                  
                  {selectedRoomDetails && (
                    <div className="bg-gray-50 p-4 rounded-md border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Selected Room:</span>
                        <span className="font-bold text-blue-600">
                          Room {selectedRoomDetails.room_number} ({selectedRoomDetails.room_type})
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Max Occupancy:</span>
                        <span>{selectedRoomDetails.max_occupancy} person(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Nightly Rate:</span>
                        <span>₹{selectedRoomDetails.price_per_night}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Advance Payment */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-blue-600" />
                    Payment Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalAmount" className="text-gray-700">
                        Total Amount
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={totalAmount.toFixed(2)}
                          className="pl-8 bg-gray-50"
                          disabled
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {totalNights} night(s) × ₹{selectedRoomDetails?.price_per_night || 0}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="advanceAmount" className="text-gray-700">
                        Advance Amount *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <Input
                          id="advanceAmount"
                          type="number"
                          placeholder="0.00"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                          className="pl-8"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Minimum 30% advance required
                      </p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="paymentMethod" className="text-gray-700">
                        Payment Method *
                      </Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="upi">📱 UPI</SelectItem>
                          <SelectItem value="card">💳 Card</SelectItem>
                          <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Validation Messages */}
                {advanceAmount > 0 && totalAmount > 0 && (
                  <div className={`p-3 rounded-md ${advanceAmount >= totalAmount * 0.3 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    <p className="font-semibold">
                      {advanceAmount >= totalAmount * 0.3 
                        ? '✅ Advance meets minimum requirement' 
                        : '⚠️ Advance is less than 30% of total'}
                    </p>
                    <p className="text-sm mt-1">
                      Advance: ₹{advanceAmount.toFixed(2)} / Minimum Required: ₹{(totalAmount * 0.3).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Phone format validation */}
                {phone && cleanPhoneNumber(phone).length !== 11 && (
                  <div className="p-3 rounded-md bg-red-50 text-red-700">
                    <p className="font-semibold">⚠️ Invalid phone number format</p>
                    <p className="text-sm mt-1">
                      Please enter a valid 10-digit Indian phone number. It will be stored as 11 digits with leading 0.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={createAdvanceBooking}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold"
                  disabled={loading || roomsLoading || rooms.length === 0 || !guestName || !phone || !checkIn || !checkOut || !roomId || advanceAmount < totalAmount * 0.3 || cleanPhoneNumber(phone).length !== 11}
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Creating Booking...
                    </>
                  ) : (
                    "Confirm Advance Booking"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Info */}
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guest:</span>
                    <span className="font-medium">{guestName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{formattedPhone || phone || "—"}</span>
                    {phone && (
                      <span className="text-xs text-gray-500 ml-2">
                        (stored as: {cleanPhoneNumber(phone)})
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{checkIn ? format(new Date(checkIn), 'MMM dd, yyyy') : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{checkOut ? format(new Date(checkOut), 'MMM dd, yyyy') : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{totalNights} night{totalNights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-medium">
                      {selectedRoomDetails 
                        ? `Room ${selectedRoomDetails.room_number} (${selectedRoomDetails.room_type})` 
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nightly Rate:</span>
                    <span className="font-medium">
                      ₹{selectedRoomDetails?.price_per_night || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {paymentMethod === 'cash' ? '💵 Cash' :
                       paymentMethod === 'upi' ? '📱 UPI' :
                       paymentMethod === 'card' ? '💳 Card' : '🏦 Bank'}
                    </span>
                  </div>
                  
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Advance:</span>
                      <span className="text-emerald-600 font-semibold">
                        ₹{advanceAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                      <span>Balance Due:</span>
                      <span className="text-blue-600">
                        ₹{Math.max(0, totalAmount - advanceAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Format Help */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-blue-600" />
                  Phone Number Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Indian phone numbers are stored with a leading 0. Acceptable formats:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
                    <li><code className="bg-gray-100 px-1 rounded">09876543210</code> (11 digits with leading 0)</li>
                    <li><code className="bg-gray-100 px-1 rounded">9876543210</code> (10 digits, auto-adds leading 0)</li>
                    <li><code className="bg-gray-100 px-1 rounded">+91 9876543210</code> (with country code)</li>
                    <li><code className="bg-gray-100 px-1 rounded">919876543210</code> (without +)</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    All formats will be converted to: <code className="bg-gray-100 px-1 rounded">09876543210</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Available Rooms */}
            {rooms.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Available Rooms ({rooms.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rooms.slice(0, 3).map((room) => (
                      <div 
                        key={room.id}
                        className={`p-3 rounded-lg border ${
                          roomId === room.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Room {room.room_number}</p>
                            <p className="text-sm text-gray-600 capitalize">{room.room_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              ₹{room.price_per_night}
                            </p>
                            <p className="text-xs text-gray-500">per night</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {rooms.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{rooms.length - 3} more room{rooms.length - 3 !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for info icon
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}