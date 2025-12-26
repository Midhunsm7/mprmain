"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  Mail,
  LogOut,
  Receipt,
  Calendar,
  Clock,
  User,
  Building,
  Plus,
  Trash2,
  DollarSign,
  UtensilsCrossed,
  Package,
  Home,
  Phone,
  Globe,
  MapPin,
  FileText,
  Percent,
  AlertTriangle,
  Shield,
  Ban,
  Hammer,
  Search,
  History,
  Clock3,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Image from "next/image";

/* -------------------- Types -------------------- */
interface GuestRow {
  id: string;
  name: string;
  room_ids: string[];
  base_amount: number;
  booked_days: number;
  check_in: string;
  email?: string | null;
  advance_payment?: number;
  room_pin?: string;
  phone?: string;
  pax?: number;
  meal_plan?: string;
  meal_plan_charge?: number;
  guest_category?: string;
  gstin?: string;
  company_name?: string;
  status?: string;
  check_out?: string;
  extra_hours?: number;
  extra_charge?: number;
  total_charge?: number;
  discount_amount?: number;
  damage_charges?: number;
  updated_at?: string;
  manual_price_override?: number;
  restaurant_charges_paid?: number; // ✅ ADD THIS: Track restaurant charges already paid in previous bill
}

interface RoomRow {
  id: string;
  room_number: string;
  status?: string;
  price_per_day?: number;
  type_name?: string;
}

interface RoomCharge {
  id: string;
  guest_id: string;
  category: string;
  description: string;
  amount: number;
  reference_id?: string;
  created_at: string;
  bill_generated?: boolean; // ✅ ADD THIS: Track if charge was included in a bill
}

type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer";

interface PaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

interface AdditionalCharge {
  id: string;
  type: 'discount' | 'damage';
  description: string;
  amount: number;
  reason?: string;
  remarks?: string;
}

interface HistoryBill {
  id: string;
  guest_name: string;
  guest_phone?: string;
  room_numbers: string[];
  check_in: string;
  check_out: string;
  total_amount: number;
  advance_paid: number;
  balance_paid: number;
  payment_method: string;
  created_at: string;
  extra_hours?: number;
  extra_charge?: number;
  restaurant_charges?: number;
  discount_amount?: number;
  damage_charges?: number;
  restaurant_charges_paid?: number; // ✅ ADD THIS
}

/* -------------------- Constants -------------------- */
const COMPANY_INFO = {
  name: "Mountain Pass Residency",
  address: "Anamari, Vazhikkadavu, Kerala 679333",
  phone: "+91 98765 43210",
  email: "info@mountainpass.com",
  website: "www.mountainpassresidency.com",
  gstin: "29ABCDE1234F1Z5",
  bankName: "State Bank of India",
  terms: "• Check-in: 2:00 PM | Check-out: 12:00 PM\n• Extra hour charge: ₹200 per hour after checkout time\n• All rates are inclusive of applicable taxes\n• Restaurant charges billed separately"
};

/* -------------------- Helpers -------------------- */
const formatCheckIn = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

const formatDateShort = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return iso;
  }
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const formatDateForFilename = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const clamp = (v: number) => (Number.isFinite(v) ? v : 0);

const PAYMENT_METHODS: { 
  value: PaymentMethod; 
  label: string; 
  icon: React.ReactNode;
  description: string;
}[] = [
  { 
    value: "cash", 
    label: "Cash", 
    icon: <Wallet className="h-5 w-5" />,
    description: "Physical cash payment"
  },
  { 
    value: "card", 
    label: "Credit/Debit Card", 
    icon: <CreditCard className="h-5 w-5" />,
    description: "Card payment via POS"
  },
  { 
    value: "upi", 
    label: "UPI", 
    icon: <Smartphone className="h-5 w-5" />,
    description: "UPI payment (PhonePe, GPay, etc.)"
  },
  { 
    value: "bank_transfer", 
    label: "Bank Transfer", 
    icon: <Building className="h-5 w-5" />,
    description: "NEFT/RTGS/IMPS transfer"
  }
];

/* -------------------- Component -------------------- */
export default function CheckoutPage() {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(() => new Date());
  const [selectedGuestRooms, setSelectedGuestRooms] = useState<Record<string, RoomRow[]>>({});
  const [advancePayments, setAdvancePayments] = useState<Record<string, number>>({});
  const [paymentSplits, setPaymentSplits] = useState<Record<string, PaymentSplit[]>>({});
  const [roomCharges, setRoomCharges] = useState<Record<string, RoomCharge[]>>({});
  const [additionalCharges, setAdditionalCharges] = useState<Record<string, AdditionalCharge[]>>({});
  const [showAddChargeModal, setShowAddChargeModal] = useState<{guestId: string, type: 'discount' | 'damage'} | null>(null);
  const [newCharge, setNewCharge] = useState<{
    description: string;
    amount: string;
    reason: string;
    remarks: string;
  }>({
    description: '',
    amount: '',
    reason: '',
    remarks: ''
  });
  const invoiceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);
  
  // History Search States
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyBills, setHistoryBills] = useState<HistoryBill[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchDate, setSearchDate] = useState<string>("");
  const [searchType, setSearchType] = useState<"name" | "phone" | "date">("name");
  const [selectedHistoryBill, setSelectedHistoryBill] = useState<HistoryBill | null>(null);
  const [regeneratingBill, setRegeneratingBill] = useState<boolean>(false);
  const [expandedHistoryBill, setExpandedHistoryBill] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("status", "checked-in")
      .order("check_in", { ascending: false });

    if (error) {
      console.error("fetchGuests error:", error);
      setGuests([]);
      setLoading(false);
      return;
    }

    const rows: GuestRow[] = (data ?? []) as GuestRow[];
    setGuests(rows);

    // Initialize advance payments from guest data
    const advances: Record<string, number> = {};
    rows.forEach(g => {
      if (g.advance_payment) {
        advances[g.id] = g.advance_payment;
      }
    });
    setAdvancePayments(advances);

    const allRoomIds = Array.from(new Set(rows.flatMap((g) => g.room_ids ?? [])));
    if (allRoomIds.length) {
      const { data: roomsData, error: roomsErr } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          status, 
          room_types (
            name, 
            base_price
          )
        `)
        .in("id", allRoomIds);

      if (roomsErr) {
        console.error("fetch rooms error:", roomsErr);
      } else {
        const byId = new Map<string, RoomRow>();
        (roomsData ?? []).forEach((r: any) => {
          byId.set(r.id, {
            id: r.id,
            room_number: r.room_number,
            status: r.status,
            price_per_day: r.room_types?.base_price ?? undefined,
            type_name: r.room_types?.name ?? undefined,
          });
        });

        const grouped: Record<string, RoomRow[]> = {};
        rows.forEach((g) => {
          grouped[g.id] = (g.room_ids ?? []).map((rid) => byId.get(rid) ?? { 
            id: rid, 
            room_number: rid, 
            price_per_day: undefined,
            type_name: undefined 
          });
        });
        setSelectedGuestRooms(grouped);
      }
    } else {
      setSelectedGuestRooms({});
    }

    // Fetch ONLY room charges (which already include restaurant bills)
    const chargesByGuest: Record<string, RoomCharge[]> = {};
    
    for (const guest of rows) {
      // Fetch room charges from room_charges table
      const { data: charges, error: chargesError } = await supabase
        .from("room_charges")
        .select("*")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });

      if (!chargesError && charges) {
        chargesByGuest[guest.id] = charges;
      }
    }

    setRoomCharges(chargesByGuest);
    setLoading(false);
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  // Fetch historical bills - FIXED VERSION
  const fetchHistoryBills = async () => {
    setHistoryLoading(true);
    try {
      // First get checked-out guests with all their data
      const { data: guestsData, error: guestsError } = await supabase
        .from("guests")
        .select("*")
        .eq("status", "checked-out")
        .order("check_out", { ascending: false })
        .limit(100);

      if (guestsError) throw guestsError;

      // Get accounts data for additional info
      const guestIds = guestsData?.map(g => g.id) || [];
      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .in("guest_id", guestIds)
        .order("created_at", { ascending: false });

      // Get payments data
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*")
        .in("guest_id", guestIds)
        .order("created_at", { ascending: false });

      // Get room numbers
      const allRoomIds = Array.from(new Set(guestsData?.flatMap((g: any) => g.room_ids ?? []) || []));
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, room_number")
        .in("id", allRoomIds);

      const roomsMap = new Map(roomsData?.map(r => [r.id, r.room_number]) || []);

      // ✅ FIXED: Get restaurant charges from accounts table instead of room_charges
      // This ensures we only get restaurant charges that were actually included in the final bill
      const { data: chargesData } = await supabase
        .from("accounts")
        .select("guest_id, restaurant_charges")
        .in("guest_id", guestIds);

      // Combine data
      const history: HistoryBill[] = (guestsData || []).map((guest: any) => {
        const guestAccount = accountsData?.find(a => a.guest_id === guest.id);
        const roomNumbers = (guest.room_ids || []).map((id: string) => roomsMap.get(id) || id);
        
        // ✅ FIXED: Get restaurant charges from accounts table (already paid in bill)
        // This is the restaurant charges that were actually billed and paid
        const restaurantChargesFromAccount = chargesData
          ?.find(c => c.guest_id === guest.id)?.restaurant_charges || 0;
        
        const mealPlanCharge = guest.meal_plan_charge || 0;

        return {
          id: guest.id,
          guest_name: guest.name,
          guest_phone: guest.phone,
          room_numbers: roomNumbers,
          check_in: guest.check_in,
          check_out: guest.check_out || guest.updated_at,
          total_amount: guestAccount?.total_amount || guest.total_charge || 0,
          advance_paid: guestAccount?.advance_amount || guest.advance_payment || 0,
          balance_paid: guestAccount?.balance_paid || (guest.total_charge || 0) - (guest.advance_payment || 0),
          payment_method: guestAccount?.payment_method || "unknown",
          created_at: guest.check_out || guest.updated_at,
          extra_hours: guest.extra_hours || 0,
          extra_charge: guest.extra_charge || 0,
          restaurant_charges: restaurantChargesFromAccount, // ✅ Use from accounts, not room_charges
          discount_amount: guest.discount_amount || 0,
          damage_charges: guest.damage_charges || 0,
          restaurant_charges_paid: restaurantChargesFromAccount // ✅ Track what was actually paid
        };
      });

      setHistoryBills(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      alert("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Search historical bills - FIXED VERSION
  const searchHistory = async () => {
    if (!searchQuery.trim() && !searchDate) {
      fetchHistoryBills();
      return;
    }

    setHistoryLoading(true);
    try {
      let query = supabase
        .from("guests")
        .select("*")
        .eq("status", "checked-out")
        .order("check_out", { ascending: false });

      if (searchType === "name" && searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`);
      } else if (searchType === "phone" && searchQuery.trim()) {
        query = query.ilike("phone", `%${searchQuery.trim()}%`);
      } else if (searchType === "date" && searchDate) {
        const startDate = new Date(searchDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(searchDate);
        endDate.setHours(23, 59, 59, 999);
        
        query = query.gte("check_out", startDate.toISOString())
                    .lte("check_out", endDate.toISOString());
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        // Get room numbers
        const allRoomIds = Array.from(new Set(data.flatMap((g: any) => g.room_ids ?? [])));
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("id, room_number")
          .in("id", allRoomIds);

        const roomsMap = new Map(roomsData?.map(r => [r.id, r.room_number]) || []);

        // ✅ FIXED: Get restaurant charges from accounts table
        const guestIds = data.map((g: any) => g.id);
        const { data: chargesData } = await supabase
          .from("accounts")
          .select("guest_id, restaurant_charges")
          .in("guest_id", guestIds);

        const history: HistoryBill[] = data.map((guest: any) => {
          const roomNumbers = (guest.room_ids || []).map((id: string) => roomsMap.get(id) || id);
          
          // ✅ FIXED: Get restaurant charges from accounts table (already paid)
          const restaurantChargesFromAccount = chargesData
            ?.find(c => c.guest_id === guest.id)?.restaurant_charges || 0;

          return {
            id: guest.id,
            guest_name: guest.name,
            guest_phone: guest.phone,
            room_numbers: roomNumbers,
            check_in: guest.check_in,
            check_out: guest.check_out || guest.updated_at,
            total_amount: guest.total_charge || 0,
            advance_paid: guest.advance_payment || 0,
            balance_paid: (guest.total_charge || 0) - (guest.advance_payment || 0),
            payment_method: "unknown",
            created_at: guest.check_out || guest.updated_at,
            extra_hours: guest.extra_hours || 0,
            extra_charge: guest.extra_charge || 0,
            restaurant_charges: restaurantChargesFromAccount, // ✅ Use from accounts
            discount_amount: guest.discount_amount || 0,
            damage_charges: guest.damage_charges || 0,
            restaurant_charges_paid: restaurantChargesFromAccount
          };
        });

        setHistoryBills(history);
      } else {
        setHistoryBills([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Search failed");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Regenerate bill from history - FIXED VERSION
  const regenerateBill = async (historyBill: HistoryBill) => {
    setRegeneratingBill(true);
    setSelectedHistoryBill(historyBill);
    
    try {
      // Create a temporary guest object with historical data
      const historicalGuest: GuestRow = {
        id: historyBill.id,
        name: historyBill.guest_name,
        room_ids: [], // We'll use room numbers from history
        base_amount: 0, // Will be calculated
        booked_days: 1, // Default, will be calculated from dates
        check_in: historyBill.check_in,
        advance_payment: historyBill.advance_paid,
        phone: historyBill.guest_phone,
        status: "checked-out",
        extra_hours: historyBill.extra_hours,
        extra_charge: historyBill.extra_charge,
        total_charge: historyBill.total_amount,
        discount_amount: historyBill.discount_amount,
        damage_charges: historyBill.damage_charges,
        restaurant_charges_paid: historyBill.restaurant_charges_paid // ✅ Include paid restaurant charges
      };

      // Calculate booked days from check-in to check-out
      const checkInDate = new Date(historyBill.check_in);
      const checkOutDate = new Date(historyBill.check_out);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const bookedDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      historicalGuest.booked_days = Math.max(1, bookedDays);

      // Create room data
      const rooms: RoomRow[] = historyBill.room_numbers.map((roomNumber, index) => ({
        id: `room-${index}`,
        room_number: roomNumber,
        type_name: "Standard"
      }));

      // ✅ FIXED: Use only the restaurant charges that were actually paid in the bill
      const charges: RoomCharge[] = [];
      if (historyBill.restaurant_charges && historyBill.restaurant_charges > 0) {
        charges.push({
          id: `charge-restaurant`,
          guest_id: historyBill.id,
          category: 'restaurant',
          description: 'Restaurant & Dining Charges (Already Paid)',
          amount: historyBill.restaurant_charges,
          created_at: historyBill.check_out
        });
      }

      // Calculate base amount from total
      const baseAmount = historyBill.total_amount - 
        (historyBill.extra_charge || 0) - 
        (historyBill.restaurant_charges || 0) -
        (historyBill.damage_charges || 0) +
        (historyBill.discount_amount || 0);
      
      historicalGuest.base_amount = Math.max(0, baseAmount);

      // Calculate bill
      const bill = calculateBillForHistory(historicalGuest, charges, rooms, historyBill.check_out);

      // Generate PDF
      await generateHistoricalPDF(historicalGuest, bill, historyBill);
      
    } catch (error) {
      console.error("Regenerate error:", error);
      alert("Failed to regenerate bill");
    } finally {
      setRegeneratingBill(false);
    }
  };

  const calculateBill = (guest: GuestRow) => {
    const bill = calculateBillForHistory(guest, roomCharges[guest.id] || [], selectedGuestRooms[guest.id] || [], now.toISOString());
    return {
      ...bill,
      isFreshenUp: guest.guest_category === 'freshen-up'
    };
  };

  const calculateBillForHistory = (
    guest: GuestRow, 
    charges: RoomCharge[], 
    rooms: RoomRow[], 
    checkoutTime: string
  ) => {
    const checkInTime = new Date(guest.check_in).getTime();
    const checkoutDateTime = new Date(checkoutTime).getTime();
    const hoursStayed = Math.max(0, Math.ceil((checkoutDateTime - checkInTime) / (1000 * 60 * 60)));
    const bookedHours = clamp(guest.booked_days) * 24;
    const extraHours = Math.max(0, hoursStayed - bookedHours);

    const defaultRoomCount = Math.max(1, rooms.length);
    const roomPrices = rooms.map((r) => r.price_per_day ?? null);

    let basePerDayTotal: number | undefined = undefined;
    
    if (guest.manual_price_override != null && guest.manual_price_override > 0) {
      basePerDayTotal = guest.manual_price_override / Math.max(1, guest.booked_days);
    } else if (roomPrices.every((p) => p != null)) {
      basePerDayTotal = roomPrices.reduce((s, v) => s + (v ?? 0), 0);
    } else {
      if (guest.base_amount != null && guest.booked_days > 0) {
        basePerDayTotal = clamp(guest.base_amount) / clamp(guest.booked_days);
      }
    }

    const isFreshenUp = guest.guest_category === 'freshen-up';

    const roomBreakdown = rooms.map((r) => {
      const pricePerDay = r.price_per_day ?? (basePerDayTotal ? basePerDayTotal / defaultRoomCount : 0);
      const subtotal = pricePerDay * clamp(guest.booked_days);
      return {
        roomNumber: r.room_number,
        roomType: r.type_name || "Standard",
        pricePerDay: Number(pricePerDay.toFixed(2)),
        days: guest.booked_days,
        subtotal: Number(subtotal.toFixed(2)),
      };
    });

    let baseTotal = 0;
    let computedTotal = 0;
    let extraChargeRate = 200;
    let extraCharge = 0;

    if (isFreshenUp) {
      if (guest.base_amount != null) {
        baseTotal = clamp(Number(guest.base_amount));
      } else {
        baseTotal = roomBreakdown.reduce((s, r) => s + r.subtotal, 0);
      }
      computedTotal = baseTotal;
      
      if (guest.booked_days > 0 && guest.base_amount != null) {
        const hourlyRate = clamp(Number(guest.base_amount)) / (clamp(guest.booked_days) * 24);
        extraCharge = extraHours * hourlyRate;
        extraChargeRate = hourlyRate;
      } else if (extraHours > 0) {
        extraCharge = extraHours * 200;
      }
      computedTotal += extraCharge;
    } else {
      baseTotal =
        guest.base_amount != null
          ? clamp(Number(guest.base_amount)) * clamp(guest.booked_days)
          : roomBreakdown.reduce((s, r) => s + r.subtotal, 0);

      extraCharge = extraHours * extraChargeRate;
      computedTotal = baseTotal + extraCharge;
    }

    // ✅ FIXED: For historical bills, use restaurant_charges_paid from guest data
    // This ensures we only show restaurant charges that were actually included in the original bill
    const restaurantCharges = guest.restaurant_charges_paid || 
      charges
        .filter(c => c.category === 'restaurant')
        .reduce((sum, c) => sum + c.amount, 0);

    const mealPlanCharge = (isFreshenUp || guest.guest_category === 'complimentary') ? 0 : (guest.meal_plan_charge || 0);

    const additionalChargesForGuest = additionalCharges[guest.id] || [];
    const totalDiscount = additionalChargesForGuest
      .filter(c => c.type === 'discount')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalDamageCharges = additionalChargesForGuest
      .filter(c => c.type === 'damage')
      .reduce((sum, c) => sum + c.amount, 0);

    const finalDiscount = guest.discount_amount || totalDiscount;
    const finalDamageCharges = guest.damage_charges || totalDamageCharges;

    const advance = advancePayments[guest.id] ?? guest.advance_payment ?? 0;
    const totalBeforeAdjustments = computedTotal + restaurantCharges + finalDamageCharges + mealPlanCharge;
    const totalAfterDiscount = Math.max(0, totalBeforeAdjustments - finalDiscount);
    const balanceDue = Math.max(0, totalAfterDiscount - advance);

    return {
      hoursStayed,
      extraHours,
      extraChargeRate,
      defaultExtraCharge: extraCharge,
      baseTotal: Number(baseTotal.toFixed(2)),
      computedTotal: Number(computedTotal),
      restaurantCharges: Number(restaurantCharges.toFixed(2)),
      mealPlanCharge: Number(mealPlanCharge.toFixed(2)),
      totalDiscount: Number(finalDiscount.toFixed(2)),
      totalDamageCharges: Number(finalDamageCharges.toFixed(2)),
      totalBeforeAdjustments: Number(totalBeforeAdjustments.toFixed(2)),
      totalAfterDiscount: Number(totalAfterDiscount.toFixed(2)),
      advanceAmount: advance,
      balanceDue: Number(balanceDue.toFixed(2)),
      roomBreakdown,
      guestCharges: charges,
      additionalCharges: additionalChargesForGuest,
      checkoutTime: checkoutTime,
      isFreshenUp
    };
  };

  // Add payment split
  const addPaymentSplit = (guestId: string) => {
    const splits = paymentSplits[guestId] ?? [];
    const newSplit: PaymentSplit = {
      id: Date.now().toString(),
      method: "cash",
      amount: 0,
      reference: ""
    };
    setPaymentSplits(prev => ({
      ...prev,
      [guestId]: [...splits, newSplit]
    }));
  };

  // Remove payment split
  const removePaymentSplit = (guestId: string, splitId: string) => {
    const splits = paymentSplits[guestId] ?? [];
    setPaymentSplits(prev => ({
      ...prev,
      [guestId]: splits.filter(s => s.id !== splitId)
    }));
  };

  // Update payment split
  const updatePaymentSplit = (guestId: string, splitId: string, field: keyof PaymentSplit, value: any) => {
    const splits = paymentSplits[guestId] ?? [];
    setPaymentSplits(prev => ({
      ...prev,
      [guestId]: splits.map(s => s.id === splitId ? { ...s, [field]: value } : s)
    }));
  };

  // Add additional charge (discount/damage)
  const addAdditionalCharge = (guestId: string, type: 'discount' | 'damage') => {
    setShowAddChargeModal({ guestId, type });
  };

  // Submit new charge
  const submitAdditionalCharge = () => {
    if (!showAddChargeModal) return;
    
    const { guestId, type } = showAddChargeModal;
    const amount = parseFloat(newCharge.amount);
    
    if (!newCharge.description || isNaN(amount) || amount <= 0) {
      alert("Please enter valid description and amount");
      return;
    }

    const newChargeObj: AdditionalCharge = {
      id: Date.now().toString(),
      type,
      description: newCharge.description,
      amount: type === 'discount' ? amount : amount,
      reason: newCharge.reason,
      remarks: newCharge.remarks
    };

    const existingCharges = additionalCharges[guestId] || [];
    setAdditionalCharges(prev => ({
      ...prev,
      [guestId]: [...existingCharges, newChargeObj]
    }));

    setNewCharge({
      description: '',
      amount: '',
      reason: '',
      remarks: ''
    });
    setShowAddChargeModal(null);
  };

  // Remove additional charge
  const removeAdditionalCharge = (guestId: string, chargeId: string) => {
    const charges = additionalCharges[guestId] || [];
    setAdditionalCharges(prev => ({
      ...prev,
      [guestId]: charges.filter(c => c.id !== chargeId)
    }));
  };

  const generatePDFforGuest = async (guest: GuestRow) => {
    const fixColors = `
    * {
      background-image: none !important;
      background: none !important;
      background-color: transparent !important;
    }
    
    [style*="gradient"] {
      background-image: none !important;
      background: #ffffff !important;
    }
    
    .header, .summary, thead, th {
      background-color: #f8f9fa !important;
      background-image: none !important;
    }
    
    * {
      color: #000000 !important;
    }
    
    * {
      color: black !important;
      border-color: #cccccc !important;
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = fixColors;
  document.head.appendChild(style);
    
    const node = invoiceRefs.current[guest.id];
    if (!node) {
      alert("Invoice area not ready");
      document.head.removeChild(style);
      return;
    }

    try {
      const canvas = await html2canvas(node, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          const style = window.getComputedStyle(element);
          return style.backgroundImage.includes('lab(') || 
                 style.color.includes('lab(') ||
                 style.backgroundColor.includes('lab(');
        }
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - margin * 2;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", margin, 10, pdfWidth, pdfHeight);
      
      const guestNameForFile = guest.name.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = formatDateForFilename(new Date());
      const fileName = `Invoice_${guestNameForFile}_${dateStr}.pdf`;
      
      pdf.save(fileName);
      return pdf;
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      document.head.removeChild(style);
    }
  };

  // Generate PDF for historical bill - FIXED VERSION
  const generateHistoricalPDF = async (guest: GuestRow, bill: any, historyBill: HistoryBill) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '200mm';
    tempDiv.style.minHeight = '287mm';
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '15mm';
    tempDiv.style.fontFamily = "'Inter', 'Segoe UI', sans-serif";
    tempDiv.style.fontSize = '10pt';
    
    tempDiv.style.color = '#000000';
    tempDiv.style.backgroundImage = 'none';
    document.body.appendChild(tempDiv);

    // ✅ FIXED: Only show restaurant charges that were actually paid
    tempDiv.innerHTML = renderHistoricalInvoice(guest, bill, historyBill);

    try {
      const canvas = await html2canvas(tempDiv, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          const style = window.getComputedStyle(element);
          return style.backgroundImage.includes('lab(') || 
                 style.color.includes('lab(') ||
                 style.backgroundColor.includes('lab(');
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - margin * 2;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", margin, 10, pdfWidth, pdfHeight);
      
      const guestNameForFile = guest.name.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = formatDateForFilename(new Date(historyBill.check_out));
      const fileName = `Historical_Invoice_${guestNameForFile}_${dateStr}.pdf`;
      
      pdf.save(fileName);
      alert(`✅ Historical invoice generated: ${fileName}`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate historical invoice");
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const printInvoice = async (guest: GuestRow) => {
    const node = invoiceRefs.current[guest.id];
    if (!node) {
      alert("Invoice not ready");
      return;
    }
    const html = node.outerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) {
      alert("Unable to open print window");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${guest.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1a1a1a; 
              background: #ffffff; 
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4;
              margin: 5mm;
            }
            .invoice-container { 
              width: 200mm; 
              min-height: 287mm; 
              margin: 0 auto; 
              background: white;
              position: relative;
            }
            @media print {
              body { 
                background: white !important;
                padding: 0 !important;
              }
              .invoice-container { 
                width: 100% !important;
                min-height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
            }
            * {
              color: #000000 !important;
              background-image: none !important;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            ${html}
          </div>
          <script>
            window.focus(); 
            setTimeout(() => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const emailInvoice = async (guest: GuestRow) => {
    try {
      setSendingEmailFor(guest.id);
      const node = invoiceRefs.current[guest.id];
      if (!node) {
        alert("Invoice area not ready");
        setSendingEmailFor(null);
        return;
      }
      
      const fixColors = `
      * {
        background-image: none !important;
        background: none !important;
        background-color: transparent !important;
      }
      
      [style*="gradient"] {
        background-image: none !important;
        background: #ffffff !important;
      }
      
      .header, .summary, thead, th {
        background-color: #f8f9fa !important;
        background-image: none !important;
      }
      
      * {
        color: #000000 !important;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = fixColors;
    document.head.appendChild(style);
      
      const canvas = await html2canvas(node, { 
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        ignoreElements: (element) => {
          const style = window.getComputedStyle(element);
          return style.backgroundImage.includes('lab(') || 
                 style.color.includes('lab(') ||
                 style.backgroundColor.includes('lab(');
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 10;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth - margin * 2;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", margin, 10, pdfWidth, pdfHeight);
      const blob = pdf.output("blob");
      
      const guestNameForFile = guest.name.replace(/[^a-zA-Z0-9]/g, "_");
      const dateStr = formatDateForFilename(new Date());
      const filename = `Invoice_${guestNameForFile}_${dateStr}.pdf`;

      const form = new FormData();
      form.append("file", blob, filename);
      form.append("guestId", guest.id);
      form.append("guestName", guest.name);
      form.append("email", guest.email ?? "");
      form.append("subject", `Invoice from ${COMPANY_INFO.name} - ${dateStr}`);

      const res = await fetch("/api/invoice/send", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("Email invoice failed:", txt);
        alert("Failed to send email invoice");
      } else {
        alert("Invoice emailed successfully");
      }
    } catch (err) {
      console.error("emailInvoice error", err);
      alert("Failed to create/send invoice");
    } finally {
      setSendingEmailFor(null);
      const style = document.querySelector('style[data-invoice-fix]');
      if (style) {
        document.head.removeChild(style);
      }
    }
  };

  const saveAdvancePayment = async (guest: GuestRow) => {
    const amount = advancePayments[guest.id];

    if (!amount || amount <= 0) {
      alert("Enter a valid advance amount");
      return;
    }

    try {
      const now = new Date().toISOString();

      const { error: guestErr } = await supabase
        .from("guests")
        .update({
          advance_payment: amount,
          updated_at: now
        })
        .eq("id", guest.id);

      if (guestErr) throw guestErr;

      const { error: paymentErr } = await supabase
        .from("payments")
        .insert({
          guest_id: guest.id,
          room_id: guest.room_ids?.[0] ?? null,
          amount: amount,
          payment_mode: "cash",
          status: "completed",
          payment_type: "advance",
          notes: `Advance payment received from ${guest.name}`,
          created_at: now
        });

      if (paymentErr) throw paymentErr;

      await supabase.from("accounts").insert({
        guest_id: guest.id,
        room_id: guest.room_ids?.[0] ?? null,
        advance_amount: amount,
        category: "advance",
        payment_method: "cash",
        created_at: now
      });

      alert("✅ Advance saved and added to revenue");
      fetchGuests();

    } catch (err) {
      console.error(err);
      alert("Failed to save advance");
    }
  };

  const doCheckout = async (guest: GuestRow) => {
    const bill = calculateBill(guest);
    const splits = paymentSplits[guest.id] ?? [];
    
    if (splits.length === 0) {
      alert("Please add at least one payment method");
      return;
    }

    const totalPaid = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalPaid - bill.balanceDue) > 0.01) {
      alert(`Payment amount (₹${totalPaid.toFixed(2)}) must equal balance due (₹${bill.balanceDue.toFixed(2)})`);
      return;
    }

    for (const split of splits) {
      if (split.method !== "cash" && !split.reference) {
        alert(`Please enter reference for ${PAYMENT_METHODS.find(p => p.value === split.method)?.label}`);
        return;
      }
    }

    const isFreshenUp = guest.guest_category === 'freshen-up';
    
    const confirmText = `Proceed to checkout ${guest.name}?\n\n${isFreshenUp ? 'Hourly Charges' : 'Room Charges'}: ₹${bill.computedTotal}\nRestaurant Charges: ₹${bill.restaurantCharges}\n${bill.mealPlanCharge > 0 ? `Meal Plan Charges: ₹${bill.mealPlanCharge}\n` : ''}Damage Charges: ₹${bill.totalDamageCharges}\nDiscounts: -₹${bill.totalDiscount}\nTotal: ₹${bill.totalAfterDiscount}\nAdvance Paid: ₹${bill.advanceAmount}\nBalance Due: ₹${bill.balanceDue}\n\nPayment Methods:\n${splits.map(s => `• ${PAYMENT_METHODS.find(p => p.value === s.method)?.label}: ₹${s.amount}`).join('\n')}`;
    
    if (!confirm(confirmText)) return;

    try {
      const payload: any = {
        status: "checked-out",
        check_out: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // ✅ ADD RESTAURANT CHARGES TO GUEST RECORD
      if (bill.restaurantCharges > 0) {
        payload.restaurant_charges_paid = bill.restaurantCharges;
      }

      if (!isFreshenUp || bill.extraHours > 0) {
        payload.extra_hours = bill.extraHours;
        payload.extra_charge = bill.defaultExtraCharge;
      }

      payload.total_charge = bill.totalAfterDiscount;

      try {
        payload.discount_amount = bill.totalDiscount;
        payload.damage_charges = bill.totalDamageCharges;
      } catch (e) {
        console.log("Optional columns not available in guests table");
      }

      const { error: guestErr } = await supabase
        .from("guests")
        .update(payload)
        .eq("id", guest.id);

      if (guestErr) {
        console.error("Guest update error:", guestErr);
        delete payload.discount_amount;
        delete payload.damage_charges;
        
        const { error: fallbackErr } = await supabase
          .from("guests")
          .update(payload)
          .eq("id", guest.id);
        
        if (fallbackErr) {
          throw new Error(`Guest update failed: ${fallbackErr.message}`);
        }
      }

      const { error: roomsErr } = await supabase
        .from("rooms")
        .update({ status: "housekeeping", current_guest_id: null })
        .in("id", guest.room_ids);
      if (roomsErr) throw new Error(`Rooms update failed: ${roomsErr.message}`);
      
      for (const roomId of guest.room_ids) {
        await supabase.from("housekeeping_tasks").insert({
          room_id: roomId,
          status: "pending",
          created_at: new Date().toISOString(),
        });
      }
      
      for (const split of splits) {
        const paymentPayload = {
          guest_id: guest.id,
          room_id: guest.room_ids[0],
          amount: split.amount,
          payment_mode: split.method,
          upi_reference: split.method === "upi" ? split.reference : null,
          bank_txn_id: split.method === "card" || split.method === "bank_transfer" ? split.reference : null,
          status: "completed",
          payment_type: "checkout",
          notes: `Checkout payment for ${guest.name}`,
          created_at: new Date().toISOString()
        };

        await supabase.from("payments").insert(paymentPayload);
      }

      for (const charge of bill.additionalCharges) {
        const chargePayload = {
          guest_id: guest.id,
          room_id: guest.room_ids[0],
          category: charge.type === 'discount' ? 'service' : 'other',
          description: charge.description,
          amount: charge.type === 'discount' ? -charge.amount : charge.amount,
          reference_id: null,
          created_at: new Date().toISOString(),
          created_by: null
        };

        await supabase.from("room_charges").insert(chargePayload);
      }

      // ✅ Save restaurant charges to accounts table for historical reference
      const accountsPayload: any = {
        guest_id: guest.id,
        room_id: guest.room_ids[0],
        base_amount: bill.baseTotal,
        total_amount: bill.totalAfterDiscount,
        payment_method: splits.map(s => s.method).join("+"),
        category: "room",
        advance_amount: bill.advanceAmount || 0,
        created_at: new Date().toISOString()
      };

      if (!isFreshenUp || bill.extraHours > 0) {
        accountsPayload.extra_hours = bill.extraHours;
        accountsPayload.extra_charge = bill.defaultExtraCharge;
      }

      try {
        if (bill.restaurantCharges > 0) {
          accountsPayload.restaurant_charges = bill.restaurantCharges;
        }
        if (bill.mealPlanCharge > 0) {
          accountsPayload.meal_plan_charge = bill.mealPlanCharge;
        }
        if (bill.totalDiscount > 0) {
          accountsPayload.discount_amount = bill.totalDiscount;
        }
        if (bill.totalDamageCharges > 0) {
          accountsPayload.damage_charges = bill.totalDamageCharges;
        }
        if (bill.balanceDue > 0) {
          accountsPayload.balance_paid = bill.balanceDue;
        }
        if (splits.length > 0) {
          accountsPayload.payment_details = JSON.stringify(splits);
        }
      } catch (e) {
        console.log("Some optional fields not available in accounts table");
      }

      try {
        const { error: accountsErr } = await supabase.from("accounts").insert(accountsPayload);
        if (accountsErr) {
          console.error("Accounts insert error details:", accountsErr);
          const minimalPayload = {
            guest_id: guest.id,
            room_id: guest.room_ids[0],
            base_amount: bill.baseTotal,
            total_amount: bill.totalAfterDiscount,
            payment_method: splits.map(s => s.method).join("+"),
            created_at: new Date().toISOString(),
            category: 'room',
            advance_amount: bill.advanceAmount || 0
          };
          
          const { error: minimalErr } = await supabase.from("accounts").insert(minimalPayload);
          if (minimalErr) {
            console.error("Minimal accounts insert also failed:", minimalErr);
          }
        }
      } catch (accountsError) {
        console.error("Accounts insertion failed:", accountsError);
      }

      setPaymentSplits(prev => {
        const newSplits = { ...prev };
        delete newSplits[guest.id];
        return newSplits;
      });

      setAdditionalCharges(prev => {
        const newCharges = { ...prev };
        delete newCharges[guest.id];
        return newCharges;
      });

      alert("✅ Checked out successfully!");
      fetchGuests();

    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Checkout failed: ${error.message}`);
    }
  };

  const renderHistoricalInvoice = (guest: GuestRow, bill: any, historyBill: HistoryBill) => {
    const checkoutDate = new Date(historyBill.check_out);
    const checkInDate = new Date(historyBill.check_in);
    const durationMs = checkoutDate.getTime() - checkInDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    return `
      <div class="invoice-container" style="width: 200mm; min-height: 287mm; margin: 0 auto; background-color: #ffffff; position: relative; overflow: hidden; font-family: 'Inter', 'Segoe UI', sans-serif; font-size: 10pt;">
        <div class="invoice-content" style="position: relative; z-index: 2; padding: 15mm;">
          <!-- Header with Historical Badge -->
          <div class="header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e8e8e8;">
            <div class="company-info" style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 600;">
                  📜 HISTORICAL INVOICE
                </div>
              </div>
              <h1 style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px 0;">
                ${COMPANY_INFO.name}
              </h1>
              <div style="font-size: 10px; color: #666; line-height: 1.3;">
                <div>${COMPANY_INFO.address}</div>
                <div style="display: flex; gap: 10px; margin-top: 2px;">
                  <span>📞 ${COMPANY_INFO.phone}</span>
                  <span>📧 ${COMPANY_INFO.email}</span>
                </div>
              </div>
            </div>
            <div class="invoice-meta" style="text-align: right; padding: 10px; min-width: 150px;">
              <h2 style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">
                TAX INVOICE
              </h2>
              <div style="font-size: 10px; color: #666; margin-bottom: 4px;">
                <strong>Invoice #:</strong> INV-${guest.id.slice(-8).toUpperCase()}
              </div>
              <div style="font-size: 10px; color: #666; margin-bottom: 4px;">
                <strong>Checkout Date:</strong> ${checkoutDate.toLocaleDateString('en-IN')}
              </div>
              <div style="font-size: 10px; color: #666;">
                <strong>Regenerated:</strong> ${new Date().toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          <!-- Bill To Section -->
          <div class="bill-to" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; font-size: 10px;">
            <div>
              <h3 style="font-size: 11px; font-weight: 600; color: #667eea; margin: 0 0 8px 0; text-transform: uppercase;">
                Bill To
              </h3>
              <div style="font-size: 11px; font-weight: 500; margin-bottom: 4px;">
                ${guest.name}
              </div>
              ${guest.phone ? `<div style="color: #666; margin-bottom: 2px;">📱 ${guest.phone}</div>` : ''}
            </div>
            <div>
              <h3 style="font-size: 11px; font-weight: 600; color: #667eea; margin: 0 0 8px 0; text-transform: uppercase;">
                Stay Details
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px;">
                <div>
                  <div style="color: #666; margin-bottom: 2px;">Check-in</div>
                  <div style="font-weight: 500;">${formatDateTime(historyBill.check_in)}</div>
                </div>
                <div>
                  <div style="color: #666; margin-bottom: 2px;">Check-out</div>
                  <div style="font-weight: 500;">${formatDateTime(historyBill.check_out)}</div>
                </div>
                <div>
                  <div style="color: #666; margin-bottom: 2px;">Duration</div>
                  <div style="font-weight: 500;">${durationDays} day${durationDays > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style="color: #666; margin-bottom: 2px;">Rooms</div>
                  <div style="font-weight: 500;">${historyBill.room_numbers.join(", ")}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Room Charges -->
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 12px; font-weight: 600; color: #1a1a1a; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #667eea;">
              Room Charges
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px;">
              <thead>
                <tr>
                  <th style="background-color: #667eea; color: white; padding: 8px; text-align: left; font-weight: 600; font-size: 9px;">Room No.</th>
                  <th style="background-color: #667eea; color: white; padding: 8px; text-align: left; font-weight: 600; font-size: 9px;">Room Type</th>
                  <th style="background-color: #667eea; color: white; padding: 8px; text-align: left; font-weight: 600; font-size: 9px;">Days</th>
                  <th style="background-color: #667eea; color: white; padding: 8px; text-align: left; font-weight: 600; font-size: 9px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${historyBill.room_numbers.map((roomNumber, idx) => `
                  <tr style="background-color: ${idx % 2 === 0 ? '#f9f9f9' : 'white'}">
                    <td style="padding: 8px; border-bottom: 1px solid #e8e8e8;">${roomNumber}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e8e8e8;">Standard</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e8e8e8;">${durationDays}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e8e8e8; font-weight: 500;">₹${(bill.computedTotal / historyBill.room_numbers.length).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Additional Charges Display -->
          ${historyBill.restaurant_charges && historyBill.restaurant_charges > 0 ? `
            <div style="background-color: #f0f7ff; padding: 12px; border-radius: 6px; border: 1px solid #cce5ff; font-size: 9px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600; color: #0066cc;">Restaurant & Dining Charges</div>
                <div style="font-weight: 600; color: #0066cc;">+ ₹${historyBill.restaurant_charges.toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          ${historyBill.extra_charge && historyBill.extra_charge > 0 ? `
            <div style="background-color: #fff9e6; padding: 12px; border-radius: 6px; border: 1px solid #ffeaa7; font-size: 9px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; color: #e17055;">Late Check-out Charges</div>
                  <div style="color: #666; font-size: 8px; margin-top: 2px;">${historyBill.extra_hours || 0} extra hour${historyBill.extra_hours && historyBill.extra_hours > 1 ? 's' : ''} @ ₹200/hour</div>
                </div>
                <div style="font-weight: 600; color: #e17055;">+ ₹${historyBill.extra_charge.toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          ${historyBill.damage_charges && historyBill.damage_charges > 0 ? `
            <div style="background-color: #fff5f5; padding: 12px; border-radius: 6px; border: 1px solid #fed7d7; font-size: 9px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600; color: #e53e3e;">Damage Charges</div>
                <div style="font-weight: 600; color: #e53e3e;">+ ₹${historyBill.damage_charges.toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          ${historyBill.discount_amount && historyBill.discount_amount > 0 ? `
            <div style="background-color: #f0fff4; padding: 12px; border-radius: 6px; border: 1px solid #c6f6d5; font-size: 9px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600; color: #38a169;">Discounts Applied</div>
                <div style="font-weight: 600; color: #38a169;">- ₹${historyBill.discount_amount.toFixed(2)}</div>
              </div>
            </div>
          ` : ''}

          <!-- Amount Summary -->
          <div class="summary" style="margin-top: 20px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e8e8e8; font-size: 10px;">
            <h4 style="font-size: 11px; font-weight: 600; color: #1a1a1a; margin: 0 0 10px 0;">
              Amount Summary
            </h4>
            <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #e8e8e8;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #666;">Room Charges:</span>
                <span style="font-weight: 500;">₹${bill.computedTotal.toFixed(2)}</span>
              </div>
              
              ${historyBill.restaurant_charges && historyBill.restaurant_charges > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #666;">Restaurant Charges:</span>
                  <span style="font-weight: 500; color: #0066cc;">+ ₹${historyBill.restaurant_charges.toFixed(2)}</span>
                </div>
              ` : ''}
              
              ${historyBill.extra_charge && historyBill.extra_charge > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #666;">Late Check-out:</span>
                  <span style="font-weight: 500; color: #e17055;">+ ₹${historyBill.extra_charge.toFixed(2)}</span>
                </div>
              ` : ''}
              
              ${historyBill.damage_charges && historyBill.damage_charges > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #666;">Damage Charges:</span>
                  <span style="font-weight: 500; color: #e53e3e;">+ ₹${historyBill.damage_charges.toFixed(2)}</span>
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-top: 1px dashed #e8e8e8; font-size: 11px; font-weight: 600;">
                <span>Subtotal:</span>
                <span>₹${(bill.computedTotal + (historyBill.restaurant_charges || 0) + (historyBill.extra_charge || 0) + (historyBill.damage_charges || 0)).toFixed(2)}</span>
              </div>
              
              ${historyBill.discount_amount && historyBill.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                  <span style="color: #666;">Discounts:</span>
                  <span style="font-weight: 500; color: #38a169;">- ₹${historyBill.discount_amount.toFixed(2)}</span>
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-top: 1px dashed #e8e8e8; border-bottom: 1px dashed #e8e8e8; font-size: 11px; font-weight: 600;">
                <span>Total Amount:</span>
                <span>₹${historyBill.total_amount.toFixed(2)}</span>
              </div>
              
              ${historyBill.advance_paid > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span style="color: #666;">Advance Paid:</span>
                  <span style="font-weight: 500; color: #00b894;">- ₹${historyBill.advance_paid.toFixed(2)}</span>
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #667eea; font-size: 14px; font-weight: 700; color: #1a1a1a;">
                <span>BALANCE PAID:</span>
                <span style="color: #667eea;">₹${historyBill.balance_paid.toFixed(2)}</span>
              </div>
            </div>
            
            <!-- Payment Method -->
            <div style="margin-top: 15px; padding: 10px; background-color: white; border-radius: 6px; border: 1px solid #e8e8e8;">
              <div style="font-size: 10px; color: #666; margin-bottom: 4px;">Payment Method:</div>
              <div style="font-weight: 500;">${historyBill.payment_method || "Multiple methods"}</div>
            </div>
            
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #e8e8e8; text-align: center; font-size: 8px; color: #888;">
              <div style="margin-bottom: 4px; font-weight: 500; color: #666;">
                ⚠️ HISTORICAL INVOICE - Regenerated for reference purposes only
              </div>
              <div>
                Original checkout: ${formatDateTime(historyBill.check_out)} • Payment status: ✅ Paid
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderInvoice = (guest: GuestRow) => {
    const bill = calculateBill(guest);
    
    let hourlyRate = 0;
    let bookedHours = 0;
    if (bill.isFreshenUp && guest.base_amount != null && guest.booked_days > 0) {
      bookedHours = clamp(guest.booked_days) * 24;
      hourlyRate = clamp(Number(guest.base_amount)) / bookedHours;
    }
    
    return (
      <div
        ref={(el) => (invoiceRefs.current[guest.id] = el)}
        className="invoice-container"
        style={{
          width: '200mm',
          minHeight: '287mm',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: '10pt'
        }}
      >
        <div className="invoice-content" style={{
          position: 'relative',
          zIndex: 2,
          padding: '15mm'
        }}>
          {/* Compact Header with Logo */}
          <div className="header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '15px',
            paddingBottom: '15px',
            borderBottom: '2px solid #e8e8e8'
          }}>
            <div className="company-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img 
                    src="/logo.png" 
                    alt="Mountain Pass Residency" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: '0 0 4px 0'
                  }}>
                    {COMPANY_INFO.name}
                  </h1>
                  <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
                    <div>{COMPANY_INFO.address}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                      <span>📞 {COMPANY_INFO.phone}</span>
                      <span>📧 {COMPANY_INFO.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-meta" style={{
              textAlign: 'right',
              padding: '10px',
              minWidth: '150px'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#1a1a1a',
                margin: '0 0 8px 0'
              }}>
                TAX INVOICE
              </h2>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                <strong>Invoice #:</strong> INV-{guest.id.slice(-8).toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                <strong>Date:</strong> {now.toLocaleDateString('en-IN')}
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>
                <strong>GSTIN:</strong> {COMPANY_INFO.gstin}
              </div>
            </div>
          </div>

          {/* Compact Bill To Section */}
          <div className="bill-to" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '15px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            fontSize: '10px'
          }}>
            <div>
              <h3 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#667eea',
                margin: '0 0 8px 0',
                textTransform: 'uppercase'
              }}>
                Bill To
              </h3>
              <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>
                {guest.name}
              </div>
              {guest.email && (
                <div style={{ color: '#666', marginBottom: '2px' }}>
                  📧 {guest.email}
                </div>
              )}
              {guest.phone && (
                <div style={{ color: '#666' }}>
                  📱 {guest.phone}
                </div>
              )}
            </div>

            <div>
              <h3 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#667eea',
                margin: '0 0 8px 0',
                textTransform: 'uppercase'
              }}>
                Stay Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>Check-in</div>
                  <div style={{ fontWeight: '500' }}>{formatCheckIn(guest.check_in)}</div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>Check-out</div>
                  <div style={{ fontWeight: '500' }}>
                    {now.toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>Duration</div>
                  <div style={{ fontWeight: '500' }}>
                    {bill.isFreshenUp ? `${bookedHours} hours` : `${guest.booked_days} day${guest.booked_days > 1 ? 's' : ''}`}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666', marginBottom: '2px' }}>Rooms</div>
                  <div style={{ fontWeight: '500' }}>
                    {(selectedGuestRooms[guest.id] ?? []).map(r => r.room_number).join(", ")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Room Charges Table */}
          <div className="charges-section" style={{ marginBottom: '15px' }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 10px 0',
              paddingBottom: '4px',
              borderBottom: '1px solid #667eea'
            }}>
              {bill.isFreshenUp ? 'Hourly Charges' : 'Room Charges'}
            </h3>
            
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '10px',
              fontSize: '9px'
            }}>
              <thead>
                <tr>
                  <th style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '9px'
                  }}>Room No.</th>
                  <th style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '9px'
                  }}>Room Type</th>
                  <th style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '9px'
                  }}>
                    {bill.isFreshenUp ? 'Hourly Rate' : 'Rate/Day'}
                  </th>
                  <th style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '9px'
                  }}>
                    {bill.isFreshenUp ? 'Hours' : 'Days'}
                  </th>
                  <th style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    padding: '8px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '9px'
                  }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {bill.roomBreakdown.map((rb, idx) => (
                  <tr key={idx} style={{
                    backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white'
                  }}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e8e8e8' }}>
                      {rb.roomNumber}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e8e8e8' }}>
                      {rb.roomType}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e8e8e8' }}>
                      {bill.isFreshenUp 
                        ? `₹${hourlyRate > 0 ? hourlyRate.toFixed(2) : rb.pricePerDay.toFixed(2)}/hour`
                        : `₹${rb.pricePerDay.toFixed(2)}/day`
                      }
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e8e8e8' }}>
                      {bill.isFreshenUp ? `${bookedHours} hours` : `${rb.days} days`}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #e8e8e8', fontWeight: '500' }}>
                      ₹{rb.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Compact Restaurant Charges */}
          {bill.restaurantCharges > 0 && (
            <div className="restaurant-section" style={{
              marginBottom: '10px',
              backgroundColor: '#f0f7ff',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #cce5ff',
              fontSize: '9px'
            }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#0066cc',
                margin: '0 0 8px 0'
              }}>
                Restaurant & Dining Charges: ₹{bill.restaurantCharges.toFixed(2)}
              </h3>
            </div>
          )}

          {/* Compact Meal Plan Charges */}
          {bill.mealPlanCharge > 0 && (
            <div className="mealplan-section" style={{
              marginBottom: '10px',
              backgroundColor: '#e8f4f8',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #b3e0f2',
              fontSize: '9px'
            }}>
              <h3 style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#0088a3',
                margin: '0 0 8px 0'
              }}>
                Meal Plan Charges: ₹{bill.mealPlanCharge.toFixed(2)}
              </h3>
            </div>
          )}

          {/* Additional Charges/Discounts Section in Invoice */}
          {(bill.totalDiscount > 0 || bill.totalDamageCharges > 0) && (
            <div className="adjustments-section" style={{
              marginBottom: '10px',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '9px'
            }}>
              {bill.totalDiscount > 0 && (
                <div style={{
                  backgroundColor: '#f0fff4',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #c6f6d5',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Percent className="h-3 w-3" style={{ color: '#38a169' }} />
                      <span style={{ fontWeight: '600', color: '#38a169' }}>Discounts Applied</span>
                    </div>
                    <div style={{ fontWeight: '600', color: '#38a169' }}>
                      -₹{bill.totalDiscount.toFixed(2)}
                    </div>
                  </div>
                  
                  {bill.additionalCharges
                    .filter(c => c.type === 'discount')
                    .map((charge, idx) => (
                      <div key={charge.id} style={{
                        marginTop: '6px',
                        paddingLeft: '16px',
                        fontSize: '8px',
                        color: '#555'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{charge.description}</span>
                          <span>-₹{charge.amount.toFixed(2)}</span>
                        </div>
                        {charge.reason && (
                          <div style={{ fontSize: '7px', color: '#777', marginTop: '2px' }}>
                            Reason: {charge.reason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {bill.totalDamageCharges > 0 && (
                <div style={{
                  backgroundColor: '#fff5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #fed7d7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle className="h-3 w-3" style={{ color: '#e53e3e' }} />
                      <span style={{ fontWeight: '600', color: '#e53e3e' }}>Damage Charges</span>
                    </div>
                    <div style={{ fontWeight: '600', color: '#e53e3e' }}>
                      +₹{bill.totalDamageCharges.toFixed(2)}
                    </div>
                  </div>
                  
                  {bill.additionalCharges
                    .filter(c => c.type === 'damage')
                    .map((charge, idx) => (
                      <div key={charge.id} style={{
                        marginTop: '6px',
                        paddingLeft: '16px',
                        fontSize: '8px',
                        color: '#555'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{charge.description}</span>
                          <span>₹{charge.amount.toFixed(2)}</span>
                        </div>
                        {charge.reason && (
                          <div style={{ fontSize: '7px', color: '#777', marginTop: '2px' }}>
                            Reason: {charge.reason}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Compact Extra Charges */}
          {bill.defaultExtraCharge > 0 && (
            <div className="extra-charges" style={{
              marginBottom: '10px',
              backgroundColor: '#fff9e6',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #ffeaa7',
              fontSize: '9px'
            }}>
              <h4 style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#e17055',
                margin: '0 0 4px 0'
              }}>
                {bill.isFreshenUp ? 'Extended Stay Charges' : 'Late Check-out Charges'}
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#666' }}>
                  {bill.extraHours} extra hour{bill.extraHours > 1 ? 's' : ''} @ ₹{bill.extraChargeRate.toFixed(2)}/hour
                </div>
                <div style={{ fontWeight: '600', color: '#e17055' }}>
                  ₹{bill.defaultExtraCharge.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Compact Summary Section */}
          <div className="summary" style={{
            marginTop: '20px',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e8e8e8',
            fontSize: '10px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              alignItems: 'start'
            }}>
              <div>
                <h4 style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 10px 0'
                }}>
                  Terms & Conditions
                </h4>
                <pre style={{
                  fontSize: '8px',
                  color: '#666',
                  lineHeight: '1.4',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {COMPANY_INFO.terms}
                </pre>
              </div>

              <div>
                <h4 style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 10px 0'
                }}>
                  Amount Summary
                </h4>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#666' }}>
                      {bill.isFreshenUp ? 'Hourly Charges:' : 'Room Charges:'}
                    </span>
                    <span style={{ fontWeight: '500' }}>₹{bill.computedTotal.toFixed(2)}</span>
                  </div>
                  
                  {bill.restaurantCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>Restaurant Charges:</span>
                      <span style={{ fontWeight: '500', color: '#0066cc' }}>
                        + ₹{bill.restaurantCharges.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {bill.mealPlanCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>Meal Plan Charges:</span>
                      <span style={{ fontWeight: '500', color: '#0088a3' }}>
                        + ₹{bill.mealPlanCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {bill.defaultExtraCharge > 0 && (
                    <div style={{ display: flex, justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>
                        {bill.isFreshenUp ? 'Extended Stay:' : 'Late Check-out:'}
                      </span>
                      <span style={{ fontWeight: '500', color: '#e17055' }}>
                        + ₹{bill.defaultExtraCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {bill.totalDamageCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>Damage Charges:</span>
                      <span style={{ fontWeight: '500', color: '#e53e3e' }}>
                        + ₹{bill.totalDamageCharges.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '8px 0',
                    padding: '8px 0',
                    borderTop: '1px dashed #e8e8e8',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <span>Subtotal:</span>
                    <span>₹{bill.totalBeforeAdjustments.toFixed(2)}</span>
                  </div>
                  
                  {bill.totalDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>Discounts:</span>
                      <span style={{ fontWeight: '500', color: '#38a169' }}>
                        - ₹{bill.totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '10px 0',
                    padding: '8px 0',
                    borderTop: '1px dashed #e8e8e8',
                    borderBottom: '1px dashed #e8e8e8',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    <span>Total After Discount:</span>
                    <span>₹{bill.totalAfterDiscount.toFixed(2)}</span>
                  </div>
                  
                  {bill.advanceAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#666' }}>Advance Paid:</span>
                      <span style={{ fontWeight: '500', color: '#00b894' }}>
                        - ₹{bill.advanceAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderTop: '2px solid #667eea',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#1a1a1a'
                  }}>
                    <span>BALANCE DUE:</span>
                    <span style={{ color: '#667eea' }}>₹{bill.balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="footer" style={{
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: '1px solid #e8e8e8',
            textAlign: 'center',
            fontSize: '8px',
            color: '#888'
          }}>
            <div style={{ marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              This is a computer-generated invoice. No signature required.
            </div>
            <div>
              Thank you for staying with us! • 📞 {COMPANY_INFO.phone} • 📧 {COMPANY_INFO.email}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const amountInWords = (amount: number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convert = (num: number): string => {
      if (num === 0) return '';
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convert(num % 100) : '');
      if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
      if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convert(num % 100000) : '');
      return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convert(num % 10000000) : '');
    };
    
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    
    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convert(paise) + ' Paise';
    }
    result += ' Only';
    
    return result;
  };

  const toggleExpandHistoryBill = (billId: string) => {
    setExpandedHistoryBill(expandedHistoryBill === billId ? null : billId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Card with History Button */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest Checkout</h1>
              <p className="text-gray-600 text-lg">Professional invoice generation and payment collection</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) {
                    fetchHistoryBills();
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <History className="h-5 w-5" />
                <span>{showHistory ? 'Hide History' : 'View Past History'}</span>
              </button>
              <button 
                onClick={fetchGuests}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="w-32 h-1.5 bg-gradient-to-r from-gray-900 to-gray-700 mt-4 rounded-full"></div>
        </div>

        {/* History Search Panel */}
        {showHistory && (
          <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Past Checkout History</h2>
                  <p className="text-purple-200 mt-2">Search and regenerate historical invoices</p>
                </div>
                <div className="flex items-center gap-2">
                  <History className="h-6 w-6" />
                  <span className="text-lg font-semibold">{historyBills.length} records found</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Search Bar */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                      Search Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSearchType("name")}
                        className={`px-4 py-2 rounded-lg transition-all ${searchType === "name" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        By Name
                      </button>
                      <button
                        onClick={() => setSearchType("phone")}
                        className={`px-4 py-2 rounded-lg transition-all ${searchType === "phone" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        By Phone
                      </button>
                      <button
                        onClick={() => setSearchType("date")}
                        className={`px-4 py-2 rounded-lg transition-all ${searchType === "date" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        By Date
                      </button>
                    </div>
                  </div>
                  
                  {searchType === "date" ? (
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Search ${searchType === "name" ? "Guest Name" : "Phone Number"}
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder={searchType === "name" ? "Enter guest name..." : "Enter phone number..."}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchDate("");
                      fetchHistoryBills();
                    }}
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={searchHistory}
                    disabled={historyLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    {historyLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Search History
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* History Results */}
              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mx-auto mb-4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : historyBills.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No Historical Records Found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyBills.map((bill) => (
                    <div key={bill.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">{bill.guest_name}</h3>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                Checked-out
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {bill.guest_phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{bill.guest_phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                <span>Rooms: {bill.room_numbers.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">₹{bill.total_amount.toFixed(2)}</div>
                            <div className="text-sm text-gray-500 mt-1">Total Amount</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleExpandHistoryBill(bill.id)}
                          className="mt-4 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                        >
                          {expandedHistoryBill === bill.id ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              View Details
                            </>
                          )}
                        </button>
                      </div>
                      
                      {expandedHistoryBill === bill.id && (
                        <div className="p-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-gray-500 text-sm mb-1">Check-in</div>
                              <div className="font-medium">{formatDateTime(bill.check_in)}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="text-gray-500 text-sm mb-1">Check-out</div>
                              <div className="font-medium">{formatDateTime(bill.check_out)}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-gray-500 text-sm mb-1">Advance Paid</div>
                              <div className="font-medium text-green-600">₹{bill.advance_paid.toFixed(2)}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="text-gray-500 text-sm mb-1">Balance Paid</div>
                              <div className="font-medium text-blue-600">₹{bill.balance_paid.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          {/* Detailed Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {bill.restaurant_charges && bill.restaurant_charges > 0 && (
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-center">
                                  <div className="text-gray-700 font-medium">Restaurant Charges (Paid in original bill)</div>
                                  <div className="text-blue-600 font-semibold">₹{bill.restaurant_charges.toFixed(2)}</div>
                                </div>
                              </div>
                            )}
                            
                            {bill.extra_charge && bill.extra_charge > 0 && (
                              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <div className="flex justify-between items-center">
                                  <div className="text-gray-700 font-medium">Late Check-out</div>
                                  <div className="text-amber-600 font-semibold">₹{bill.extra_charge.toFixed(2)}</div>
                                </div>
                                {bill.extra_hours && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {bill.extra_hours} extra hour{bill.extra_hours > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {bill.damage_charges && bill.damage_charges > 0 && (
                              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <div className="flex justify-between items-center">
                                  <div className="text-gray-700 font-medium">Damage Charges</div>
                                  <div className="text-red-600 font-semibold">₹{bill.damage_charges.toFixed(2)}</div>
                                </div>
                              </div>
                            )}
                            
                            {bill.discount_amount && bill.discount_amount > 0 && (
                              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex justify-between items-center">
                                  <div className="text-gray-700 font-medium">Discounts Applied</div>
                                  <div className="text-green-600 font-semibold">-₹{bill.discount_amount.toFixed(2)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => regenerateBill(bill)}
                              disabled={regeneratingBill && selectedHistoryBill?.id === bill.id}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-all duration-200 font-medium"
                            >
                              {regeneratingBill && selectedHistoryBill?.id === bill.id ? (
                                <>
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                  </svg>
                                  Regenerating...
                                </>
                              ) : (
                                <>
                                  <Clock3 className="h-4 w-4" />
                                  Regenerate Invoice
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Guests Section */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : guests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Guests Checked-in</h3>
            <p className="text-gray-500 mb-6">There are currently no guests to checkout</p>
            <button 
              onClick={fetchGuests}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {guests.map((guest) => {
              const bill = calculateBill(guest);
              const splits = paymentSplits[guest.id] ?? [];
              const totalSplitAmount = splits.reduce((sum, s) => sum + s.amount, 0);
              const remainingBalance = bill.balanceDue - totalSplitAmount;
              const isFreshenUp = guest.guest_category === 'freshen-up';
              
              let hourlyRate = 0;
              let bookedHours = 0;
              if (isFreshenUp && guest.base_amount != null && guest.booked_days > 0) {
                bookedHours = clamp(guest.booked_days) * 24;
                hourlyRate = clamp(Number(guest.base_amount)) / bookedHours;
              }

              return (
                <div key={guest.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  {/* Guest Header */}
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold">{guest.name}</h2>
                          {isFreshenUp && (
                            <span className="px-3 py-1 bg-cyan-700 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Freshen-up Booking
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-300">
                          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                            <Calendar className="h-4 w-4" />
                            <span>{formatCheckIn(guest.check_in)}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                            <Building className="h-4 w-4" />
                            <span>Rooms: {(selectedGuestRooms[guest.id] ?? []).map(r => r.room_number).join(", ") || "—"}</span>
                          </div>
                          {isFreshenUp && hourlyRate > 0 && (
                            <div className="flex items-center gap-2 bg-cyan-900/50 px-3 py-1.5 rounded-lg">
                              <Clock className="h-4 w-4" />
                              <span>Hourly Rate: ₹{hourlyRate.toFixed(2)}/hour</span>
                            </div>
                          )}
                          {bill.restaurantCharges > 0 && (
                            <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1.5 rounded-lg">
                              <UtensilsCrossed className="h-4 w-4" />
                              <span>Food & Beverage: ₹{bill.restaurantCharges.toFixed(2)}</span>
                            </div>
                          )}
                          {bill.mealPlanCharge > 0 && (
                            <div className="flex items-center gap-2 bg-cyan-900/50 px-3 py-1.5 rounded-lg">
                              <UtensilsCrossed className="h-4 w-4" />
                              <span>Meal Plan: ₹{bill.mealPlanCharge.toFixed(2)}</span>
                            </div>
                          )}
                          {bill.totalDiscount > 0 && (
                            <div className="flex items-center gap-2 bg-green-900/50 px-3 py-1.5 rounded-lg">
                              <Percent className="h-4 w-4" />
                              <span>Discount: -₹{bill.totalDiscount.toFixed(2)}</span>
                            </div>
                          )}
                          {bill.totalDamageCharges > 0 && (
                            <div className="flex items-center gap-2 bg-red-900/50 px-3 py-1.5 rounded-lg">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Damage Charges: ₹{bill.totalDamageCharges.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 lg:mt-0 text-right">
                        <div className="text-4xl font-bold">₹{bill.totalAfterDiscount.toFixed(2)}</div>
                        <div className="text-gray-300 text-sm uppercase tracking-wider mt-1">
                          {isFreshenUp ? 'Total Charges' : 'Total Amount'}
                        </div>
                        {isFreshenUp && guest.base_amount && (
                          <div className="text-sm text-cyan-300 mt-2">
                            Base Rate: ₹{clamp(Number(guest.base_amount)).toFixed(2)} for {bookedHours} hours
                          </div>
                        )}
                        {bill.advanceAmount > 0 && (
                          <div className="text-sm text-green-300 mt-2">
                            Advance Paid: ₹{bill.advanceAmount.toFixed(2)}
                          </div>
                        )}
                        <div className="text-sm text-yellow-300 mt-1">
                          Balance Due: ₹{bill.balanceDue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Advance Payment Section */}
                    <div className="mt-4 p-3 border rounded-lg bg-slate-50">
                      <label className="text-sm font-medium block mb-1">
                        Advance Amount (₹)
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          value={advancePayments[guest.id] ?? ""}
                          onChange={(e) =>
                            setAdvancePayments(prev => ({
                              ...prev,
                              [guest.id]: Number(e.target.value)
                            }))
                          }
                          className="border rounded px-2 py-1 w-40"
                        />

                        <button
                          onClick={() => saveAdvancePayment(guest)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Save Advance
                        </button>
                      </div>
                    </div>

                    {/* Invoice Display - Hidden in production, shown for print/PDF */}
                    <div className="hidden">
                      {renderInvoice(guest)}
                    </div>

                    {/* Additional Charges Section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Additional Adjustments</h3>
                        <div className="flex gap-3">
                          <button
                            onClick={() => addAdditionalCharge(guest.id, 'discount')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                          >
                            <Percent className="h-5 w-5" />
                            Add Discount
                          </button>
                          <button
                            onClick={() => addAdditionalCharge(guest.id, 'damage')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                          >
                            <AlertTriangle className="h-5 w-5" />
                            Add Damage Charge
                          </button>
                        </div>
                      </div>

                      {/* Display Additional Charges */}
                      {bill.additionalCharges.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Discounts */}
                          {bill.additionalCharges.filter(c => c.type === 'discount').length > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Percent className="h-5 w-5 text-green-600" />
                                Discounts Applied
                                <span className="ml-auto text-green-700 font-bold">
                                  -₹{bill.totalDiscount.toFixed(2)}
                                </span>
                              </h4>
                              <div className="space-y-3">
                                {bill.additionalCharges
                                  .filter(c => c.type === 'discount')
                                  .map((charge) => (
                                    <div key={charge.id} className="bg-white rounded-lg p-4 border border-green-100">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <div className="font-medium text-gray-800">{charge.description}</div>
                                          {charge.reason && (
                                            <div className="text-sm text-gray-600 mt-1">Reason: {charge.reason}</div>
                                          )}
                                          {charge.remarks && (
                                            <div className="text-xs text-gray-500 mt-1">{charge.remarks}</div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-lg font-bold text-green-700">
                                            -₹{charge.amount.toFixed(2)}
                                          </span>
                                          <button
                                            onClick={() => removeAdditionalCharge(guest.id, charge.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Damage Charges */}
                          {bill.additionalCharges.filter(c => c.type === 'damage').length > 0 && (
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6 border-2 border-red-200">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Damage Charges
                                <span className="ml-auto text-red-700 font-bold">
                                  ₹{bill.totalDamageCharges.toFixed(2)}
                                </span>
                              </h4>
                              <div className="space-y-3">
                                {bill.additionalCharges
                                  .filter(c => c.type === 'damage')
                                  .map((charge) => (
                                    <div key={charge.id} className="bg-white rounded-lg p-4 border border-red-100">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <div className="font-medium text-gray-800">{charge.description}</div>
                                          {charge.reason && (
                                            <div className="text-sm text-gray-600 mt-1">Reason: {charge.reason}</div>
                                          )}
                                          {charge.remarks && (
                                            <div className="text-xs text-gray-500 mt-1">{charge.remarks}</div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-lg font-bold text-red-700">
                                            ₹{charge.amount.toFixed(2)}
                                          </span>
                                          <button
                                            onClick={() => removeAdditionalCharge(guest.id, charge.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Collection Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Payment Collection</h3>
                          <p className="text-sm text-gray-600">Balance Due: ₹{bill.balanceDue.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => addPaymentSplit(guest.id)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                        >
                          <Plus className="h-5 w-5" />
                          Add Payment Method
                        </button>
                      </div>

                      {splits.length > 0 && (
                        <div className="space-y-4">
                          {splits.map((split, idx) => (
                            <div key={split.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                      Payment Method
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={split.method}
                                        onChange={(e) => updatePaymentSplit(guest.id, split.id, 'method', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                      >
                                        {PAYMENT_METHODS.map(m => (
                                          <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                      </select>
                                      <div className="absolute right-3 top-3 pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                      Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={split.amount || ""}
                                      onChange={(e) => updatePaymentSplit(guest.id, split.id, 'amount', Number(e.target.value))}
                                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="0.00"
                                      step="0.01"
                                    />
                                  </div>

                                  {split.method !== "cash" && (
                                    <div>
                                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                                        Transaction ID
                                      </label>
                                      <input
                                        type="text"
                                        value={split.reference || ""}
                                        onChange={(e) => updatePaymentSplit(guest.id, split.id, 'reference', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter transaction reference"
                                      />
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => removePaymentSplit(guest.id, split.id)}
                                  className="mt-8 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 border-2 border-blue-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Total Collected</div>
                                <div className="text-2xl font-bold text-blue-700">₹{totalSplitAmount.toFixed(2)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Balance Due</div>
                                <div className="text-2xl font-bold text-blue-700">₹{bill.balanceDue.toFixed(2)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Payment Status</div>
                                <div className={`text-2xl font-bold ${remainingBalance > 0.01 ? 'text-amber-600' : remainingBalance < -0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                  {remainingBalance > 0.01 
                                    ? `Short: ₹${Math.abs(remainingBalance).toFixed(2)}` 
                                    : remainingBalance < -0.01 
                                      ? `Excess: ₹${Math.abs(remainingBalance).toFixed(2)}` 
                                      : '✓ Fully Paid'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 justify-end">
                      <button
                        onClick={() => generatePDFforGuest(guest)}
                        className="flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        <Download className="h-5 w-5" />
                        Download PDF Invoice
                      </button>

                      <button
                        onClick={() => printInvoice(guest)}
                        className="flex items-center gap-3 px-7 py-3.5 border-2 border-gray-700 hover:bg-gray-700 text-gray-700 hover:text-white rounded-xl transition-all duration-200 font-medium"
                      >
                        <Printer className="h-5 w-5" />
                        Print Invoice
                      </button>

                      {guest.email && (
                        <button
                          onClick={() => emailInvoice(guest)}
                          className="flex items-center gap-3 px-7 py-3.5 border-2 border-blue-600 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all duration-200 font-medium"
                          disabled={sendingEmailFor === guest.id}
                        >
                          <Mail className="h-5 w-5" />
                          {sendingEmailFor === guest.id ? "Sending..." : "Email Invoice"}
                        </button>
                      )}

                      <button
                        onClick={() => doCheckout(guest)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                        disabled={Math.abs(remainingBalance) > 0.01}
                      >
                        <LogOut className="h-5 w-5" />
                        Complete Checkout
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Charge Modal */}
        {showAddChargeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className={`p-6 ${showAddChargeModal.type === 'discount' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} rounded-t-2xl`}>
                <div className="flex items-center gap-3">
                  {showAddChargeModal.type === 'discount' ? (
                    <Percent className="h-6 w-6 text-white" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-white" />
                  )}
                  <h2 className="text-xl font-bold text-white">
                    Add {showAddChargeModal.type === 'discount' ? 'Discount' : 'Damage Charge'}
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={newCharge.description}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Loyalty discount, Broken glass, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={newCharge.amount}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={newCharge.reason}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Staff error, Guest complaint, Broken item"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Additional Remarks
                  </label>
                  <textarea
                    value={newCharge.remarks}
                    onChange={(e) => setNewCharge(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional details..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddChargeModal(null);
                    setNewCharge({ description: '', amount: '', reason: '', remarks: '' });
                  }}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAdditionalCharge}
                  className={`px-6 py-2.5 text-white rounded-xl font-medium ${showAddChargeModal.type === 'discount' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'}`}
                >
                  Add {showAddChargeModal.type === 'discount' ? 'Discount' : 'Charge'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}