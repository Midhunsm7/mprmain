"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/usetoast";

/* ------------------------------------------------------------------ */
/* Helper: Get existing guest by phone OR create new one                */
/* ------------------------------------------------------------------ */
async function getOrCreateGuest(
  supabase: any,
  guestName: string,
  phone: string
) {
  // 1️⃣ Try to find existing guest
  const { data: existingGuest } = await supabase
    .from("guests")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingGuest) {
    return existingGuest;
  }

  // 2️⃣ Create new guest if not found
  const { data: newGuest, error } = await supabase
    .from("guests")
    .insert({
      name: guestName,
      phone,
      status: "booked",
    })
    .select("id")
    .single();

  if (error) throw error;
  return newGuest;
}

export default function AdvanceBookingPage() {
  const { toast } = useToast();

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomId, setRoomId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Load available rooms                                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    const { data } = await supabase
      .from("rooms")
      .select("id, room_number")
      .eq("status", "available");

    setRooms(data || []);
  }

  /* ------------------------------------------------------------------ */
  /* Create advance booking                                              */
  /* ------------------------------------------------------------------ */
  async function createAdvanceBooking() {
    if (!guestName || !phone || !checkIn || !checkOut || !roomId) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // 1️⃣ Get or create guest
    let guest;
    try {
      guest = await getOrCreateGuest(supabase, guestName, phone);
    } catch (err) {
      setLoading(false);
      toast({
        title: "Guest error",
        description: "Unable to create or fetch guest",
        variant: "destructive",
      });
      return;
    }

    // 2️⃣ Create advance booking
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        guest_id: guest.id,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        status: "pending",
        booking_type: "advance",
        advance_amount: advanceAmount,
      })
      .select()
      .single();

    if (bookingErr) {
      setLoading(false);
      toast({
        title: "Booking failed",
        description: bookingErr.message,
        variant: "destructive",
      });
      return;
    }

    // 3️⃣ Save advance payment (if any)
    if (advanceAmount > 0) {
      const { error: paymentErr } = await supabase.from("payments").insert({
        booking_id: booking.id,
        guest_id: guest.id,
        amount: advanceAmount,
        method: paymentMethod,
        status: "paid",
      });

      if (paymentErr) {
        setLoading(false);
        toast({
          title: "Payment error",
          description: paymentErr.message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(false);
    toast({
      title: "Success",
      description: "Advance booking created successfully",
    });

    // Optional: reset form
    setGuestName("");
    setPhone("");
    setCheckIn("");
    setCheckOut("");
    setRoomId("");
    setAdvanceAmount(0);
    setPaymentMethod("cash");
  }

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Advance Room Booking</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="Guest Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />

        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />

        <Input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />

        <select
          className="w-full border rounded p-2"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        >
          <option value="">Select Room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              Room {r.room_number}
            </option>
          ))}
        </select>

        <Input
          type="number"
          placeholder="Advance Amount"
          value={advanceAmount}
          onChange={(e) => setAdvanceAmount(Number(e.target.value))}
        />

        <select
          className="w-full border rounded p-2"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="bank">Bank</option>
        </select>

        <Button
          onClick={createAdvanceBooking}
          className="w-full"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Advance Booking"}
        </Button>
      </CardContent>
    </Card>
  );
}
