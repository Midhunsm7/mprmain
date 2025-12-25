import { supabase } from "@/lib/supabaseClient";

/* ---------------- TYPES ---------------- */

export interface GuestRow {
  id: string;
  name: string;
  room_ids: string[];
  base_amount: number | null;
  booked_days: number;
  check_in: string;
  advance_payment?: number;
  guest_category?: string;
  manual_price_override?: number;
  discount_amount?: number;
  damage_charges?: number;
  meal_plan_charge?: number;
}

export interface RoomRow {
  id: string;
  room_number: string;
  price_per_day?: number;
  type_name?: string;
}

export interface BillingSnapshot {
  guestId: string;
  bookedDays: number;
  baseAmount: number | null;
  manualOverride: number | null;
  advancePaid: number;
  guestCategory?: string;
  restaurantCharges: number;
  discountAmount: number;
  damageCharges: number;
  mealPlanCharge: number;
  checkIn: string;
}

/* ---------------- HELPERS ---------------- */

const clamp = (v: number) => (Number.isFinite(v) ? v : 0);

/* ---------------- BILLING CORE ---------------- */

export function calculateBillFromSnapshot(
  snapshot: BillingSnapshot,
  rooms: RoomRow[],
  checkoutISO: string
) {
  const {
    bookedDays,
    baseAmount,
    manualOverride,
    advancePaid,
    restaurantCharges,
    discountAmount,
    damageCharges,
    mealPlanCharge,
    guestCategory,
    checkIn,
  } = snapshot;

  const isFreshenUp = guestCategory === "freshen-up";
  const isComplimentary = guestCategory === "complimentary";

  const hoursStayed = Math.ceil(
    (new Date(checkoutISO).getTime() - new Date(checkIn).getTime()) / 36e5
  );

  const allowedHours = Math.max(1, bookedDays) * 24;
  const extraHours = Math.max(0, hoursStayed - allowedHours);
  const EXTRA_RATE = 200;

  /* ---------- BASE TOTAL ---------- */
  let baseTotal = 0;

  if (manualOverride != null) {
    baseTotal = clamp(manualOverride);
  } else if (isComplimentary) {
    baseTotal = 0;
  } else if (baseAmount != null) {
    baseTotal = clamp(baseAmount) * Math.max(1, bookedDays);
  } else {
    baseTotal = rooms.reduce(
      (s, r) => s + clamp(r.price_per_day ?? 0) * bookedDays,
      0
    );
  }

  /* ---------- EXTRA ---------- */
  const extraCharge = isFreshenUp && baseAmount
    ? (extraHours * baseAmount) / allowedHours
    : extraHours * EXTRA_RATE;

  /* ---------- TOTAL ---------- */
  const gross =
    baseTotal +
    extraCharge +
    restaurantCharges +
    damageCharges +
    mealPlanCharge;

  const net = Math.max(0, gross - discountAmount);
  const balance = Math.max(0, net - advancePaid);

  return {
    baseTotal,
    extraHours,
    extraCharge,
    gross,
    net,
    advancePaid,
    balance,
  };
}

/* ---------------- FETCH SNAPSHOT ---------------- */

export async function buildBillingSnapshot(guest: GuestRow) {
  const { data: charges } = await supabase
    .from("room_charges")
    .select("category, amount")
    .eq("guest_id", guest.id);

  const restaurantCharges =
    charges?.filter(c => c.category === "restaurant")
      .reduce((s, c) => s + c.amount, 0) ?? 0;

  return {
    guestId: guest.id,
    bookedDays: guest.booked_days ?? 1,
    baseAmount: guest.base_amount ?? null,
    manualOverride: guest.manual_price_override ?? null,
    advancePaid: guest.advance_payment ?? 0,
    guestCategory: guest.guest_category,
    restaurantCharges,
    discountAmount: guest.discount_amount ?? 0,
    damageCharges: guest.damage_charges ?? 0,
    mealPlanCharge: guest.meal_plan_charge ?? 0,
    checkIn: guest.check_in,
  } satisfies BillingSnapshot;
}

/* ---------------- CHECKOUT ---------------- */

export async function checkoutGuest(
  guest: GuestRow,
  rooms: RoomRow[],
  payments: { method: string; amount: number; ref?: string }[]
) {
  const snapshot = await buildBillingSnapshot(guest);
  const bill = calculateBillFromSnapshot(
    snapshot,
    rooms,
    new Date().toISOString()
  );

  /* 1️⃣ UPDATE GUEST */
  await supabase
    .from("guests")
    .update({
      status: "checked-out",
      check_out: new Date().toISOString(),
      total_charge: bill.net,
      extra_hours: bill.extraHours,
      extra_charge: bill.extraCharge,
    })
    .eq("id", guest.id);

  /* 2️⃣ FREE ROOMS */
  await supabase
    .from("rooms")
    .update({ status: "housekeeping", current_guest_id: null })
    .in("id", guest.room_ids);

  /* 3️⃣ PAYMENTS */
  for (const p of payments) {
    await supabase.from("payments").insert({
      guest_id: guest.id,
      room_id: guest.room_ids[0],
      amount: p.amount,
      payment_mode: p.method,
      payment_type: "checkout",
      status: "completed",
    });
  }

  /* 4️⃣ ACCOUNTS (REPORTING) */
  await supabase.from("accounts").insert({
    guest_id: guest.id,
    room_id: guest.room_ids[0],
    base_amount: bill.baseTotal,
    total_amount: bill.net,
    advance_amount: bill.advancePaid,
    balance_paid: bill.balance,
    category: "room",
    created_at: new Date().toISOString(),
  });

  return bill;
}
