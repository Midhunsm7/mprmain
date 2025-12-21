"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Guest {
  id: string;
  name: string;
  roomIds: string[];
  checkInISO: string;
  bookedDays: number;
  status: "checked-in" | "checked-out";
}

interface Props {
  guests: Guest[];
  onCheckout: (guest: Guest) => void;
}

// helper: format in clean Indian 12-hour format
const formatDateTime12 = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Calculate hours stayed
const hoursSince = (iso: string) => {
  const start = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.ceil(hours);
};

export default function GuestList({ guests, onCheckout }: Props) {
  const activeGuests = guests.filter((g) => g.status === "checked-in");

  return (
    <Card className="border border-black shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Current Guests</CardTitle>
      </CardHeader>

      <CardContent>
        {activeGuests.length === 0 ? (
          <p className="text-sm text-gray-500">No active guests right now</p>
        ) : (
          <div className="space-y-3">
            {activeGuests.map((guest) => {
              const hours = hoursSince(guest.checkInISO);

              return (
                <div
                  key={guest.id}
                  className="border border-gray-200 rounded-md p-3 space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{guest.name}</p>
                      <p className="text-xs opacity-70">
                        Rooms: {guest.roomIds.join(", ")}
                      </p>
                      <p className="text-xs opacity-70">
                        Check-in: {formatDateTime12(guest.checkInISO)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">{hours} hrs</p>
                      <p className="text-xs opacity-60">
                        Booked: {guest.bookedDays} days
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 text-right">

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
