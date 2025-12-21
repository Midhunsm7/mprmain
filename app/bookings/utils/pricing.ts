/* ================= ROOM BASE PRICES (FALLBACK ONLY) ================= */

export const BASE_PRICES: Record<
  | "Executive"
  | "Deluxe"
  | "Premium"
  | "Suite"
  | "Deluxe Non AC"
  | "Handicap",
  number
> = {
  Executive: 4800,
  Deluxe: 2800,
  Premium: 3800,
  Suite: 6800,
  "Deluxe Non AC": 1500,
  Handicap: 0, // set later if needed
};

/* ================= LATE CHECKOUT ================= */

export const HOURLY_LATE_FEE = 200;

/* ================= TOTAL ROOM COST ================= */

/**
 * Calculates total room tariff for stay
 * Priority:
 * 1. room.pricePerDay (from DB)
 * 2. BASE_PRICES fallback
 */
export const calculateRoomTotal = (
  rooms: {
    category?: keyof typeof BASE_PRICES;
    pricePerDay?: number;
  }[],
  days: number
) => {
  const dailyTotal = rooms.reduce((sum, room) => {
    if (typeof room.pricePerDay === "number") {
      return sum + room.pricePerDay;
    }

    if (room.category && BASE_PRICES[room.category]) {
      return sum + BASE_PRICES[room.category];
    }

    return sum;
  }, 0);

  return dailyTotal * days;
};

/* ================= TIME HELPERS ================= */

export const hoursSince = (iso: string) => {
  const start = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - start;
  return Math.ceil(diffMs / (1000 * 60 * 60));
};

/* ================= LATE CHECKOUT CHARGE ================= */

export const calculateExtraCharge = (
  checkInISO: string,
  bookedDays: number
) => {
  const totalHours = hoursSince(checkInISO);
  const bookedHours = bookedDays * 24;
  const extraHours = Math.max(0, totalHours - bookedHours);

  return {
    extraHours,
    extraCharge: extraHours * HOURLY_LATE_FEE,
  };
};
