import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      phone, 
      address, 
      room_id, 
      days = 1, 
      pax = 1,
      idProof,
      mealPlan = "none",
      mealPlanCharge = 0,
      gstin,
      companyName,
      guestCategory = "walk-in",
      purposeOfVisit = "leisure",
      advanceAmount = 0,
      bookingType = "daily", // "daily" or "hourly"
      hours = 0, // For freshen-up bookings
      manualPrice,
      totalAmount, // Total amount from frontend
    } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const checkIn = new Date();
    const checkOut = new Date();
    
    // Calculate checkout based on booking type
    if (bookingType === "hourly") {
      // Freshen up - add hours instead of days
      checkOut.setHours(checkOut.getHours() + Number(hours));
    } else {
      // Regular booking - add days
      checkOut.setDate(checkOut.getDate() + Number(days));
    }

    // Validate advance amount
    const validAdvanceAmount = Math.max(0, Number(advanceAmount) || 0);
    if (validAdvanceAmount > totalAmount) {
      return NextResponse.json(
        { error: "Advance amount cannot exceed total amount" },
        { status: 400 }
      );
    }

    // Calculate balance
    const balanceAmount = totalAmount - validAdvanceAmount;

    // 1️⃣ Find / create guest
    const { data: existingGuests } = await supabase
      .from("guests")
      .select("*")
      .eq("phone", phone)
      .limit(1);

    let guestId: string;
const guestData = {
  name,
  address,
  id_proof: idProof,
  pax,
  status: "checked-in",
  check_in: checkIn,
  check_out: checkOut,
  room_ids: [room_id],
  meal_plan: mealPlan,
  meal_plan_charge: mealPlanCharge,
  gstin: gstin || null,
  company_name: companyName || null,
  guest_category: guestCategory,
  purpose_of_visit: purposeOfVisit,
  booked_days: bookingType === "hourly" ? 0 : days,
  extra_hours: bookingType === "hourly" ? hours : 0,
  advance_payment: validAdvanceAmount, // ✅ ADD THIS LINE
  base_amount: manualPrice ? parseFloat(manualPrice) : null, // ✅ ADD THIS LINE FOR MANUAL PRICE
};

    if (existingGuests && existingGuests.length > 0) {
      guestId = existingGuests[0].id;

      // Check if guest is already checked in
      if (existingGuests[0].status === "checked-in") {
        return NextResponse.json(
          { error: `Guest "${name}" is already checked-in. Please check them out first.` },
          { status: 400 }
        );
      }

      await supabase
        .from("guests")
        .update(guestData)
        .eq("id", guestId);
    } else {
      const { data: newGuest } = await supabase
        .from("guests")
        .insert({
          ...guestData,
          phone,
        })
        .select()
        .single();

      guestId = newGuest!.id;
    }

    // 2️⃣ Create booking with advance amount
    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        guest_id: guestId,
        room_id,
        check_in: checkIn.toISOString().slice(0, 10),
        check_out: checkOut.toISOString().slice(0, 10),
        status: "checked-in",
        booking_type: bookingType === "hourly" ? "freshen-up" : "regular",
        base_amount: totalAmount,
        total: totalAmount,
        advance_amount: validAdvanceAmount,
      })
      .select()
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // 3️⃣ Create account entry with advance and balance tracking
    await supabase.from("accounts").insert({
      guest_id: guestId,
      room_id,
      base_amount: totalAmount,
      total_amount: totalAmount,
      advance_amount: validAdvanceAmount,
      balance_paid: 0, // No additional payment yet
      category: "room",
      restaurant_charges: 0,
      discount_amount: 0,
      damage_charges: 0,
      extra_hours: bookingType === "hourly" ? hours : 0,
      extra_charge: 0,
      payment_method: validAdvanceAmount > 0 ? "advance_received" : null,
      payment_details: validAdvanceAmount > 0 ? {
        advance_paid: validAdvanceAmount,
        balance_due: balanceAmount,
        paid_at_checkin: new Date().toISOString()
      } : null,
    });

    // 4️⃣ If advance amount is paid, create payment record
    if (validAdvanceAmount > 0) {
      await supabase.from("payments").insert({
        booking_id: booking.id,
        guest_id: guestId,
        amount: validAdvanceAmount,
        total_amount: validAdvanceAmount,
        method: "advance",
        payment_mode: "advance_at_checkin",
        status: "completed",
        cash_register: true, // Track in cash register
      });

      // Update cash register
      const { data: cashRegister } = await supabase
        .from("cash_register")
        .select("*")
        .limit(1)
        .single();

      if (cashRegister) {
        await supabase
          .from("cash_register")
          .update({
            balance: Number(cashRegister.balance) + validAdvanceAmount,
          })
          .eq("id", cashRegister.id);

        // Log transaction
        await supabase.from("cash_register_transactions").insert({
          register_id: cashRegister.id,
          change_amount: validAdvanceAmount,
          reason: `Advance payment for booking ${booking.id}`,
          reference_id: booking.id,
        });
      }

      // Create ledger entry for advance
      await supabase.from("ledger").insert({
        date: new Date().toISOString().slice(0, 10),
        account: "Advance Payments",
        type: "Credit",
        amount: validAdvanceAmount,
        note: `Advance payment from ${name} (Phone: ${phone}) for ${bookingType === "hourly" ? "freshen-up" : "room"} booking`,
        source: {
          type: "advance_payment",
          booking_id: booking.id,
          guest_id: guestId,
        },
      });
    }

    // 5️⃣ Mark room occupied
    await supabase
      .from("rooms")
      .update({
        status: "occupied",
        current_guest_id: guestId,
      })
      .eq("id", room_id);

    // 6️⃣ Create audit log
    await supabase.from("audit_log").insert({
      action: "guest_checkin",
      details: {
        guest_id: guestId,
        guest_name: name,
        room_id,
        booking_id: booking.id,
        booking_type: bookingType,
        hours: hours || null,
        days: days || null,
        guest_category: guestCategory,
        total_amount: totalAmount,
        advance_amount: validAdvanceAmount,
        balance_due: balanceAmount,
        meal_plan: mealPlan !== "none" ? mealPlan : null,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      guest_id: guestId,
      total_amount: totalAmount,
      advance_paid: validAdvanceAmount,
      balance_due: balanceAmount,
      booking_type: bookingType,
      check_out_time: checkOut.toISOString(),
      message: validAdvanceAmount > 0 
        ? `Check-in successful! Advance ₹${validAdvanceAmount} received. Balance due: ₹${balanceAmount}`
        : `Check-in successful! Total amount: ₹${totalAmount}`,
    });

  } catch (err: any) {
    console.error("Check-in error:", err);
    return NextResponse.json(
      { error: err.message || "Check-in failed" },
      { status: 500 }
    );
  }
}