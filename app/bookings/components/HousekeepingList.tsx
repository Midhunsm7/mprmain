"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HousekeepingRoom = {
  id: string;
  room_number: string;
  category: string;
  status: string;
  housekeeping_status: "pending" | "inspection" | "cleaning";
};

export default function HousekeepingWidget() {
  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    setLoading(true);
    const res = await fetch("/api/housekeeping/rooms");
    const data = await res.json();
    setRooms(Array.isArray(data.rooms) ? data.rooms : []);
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const label = (status: HousekeepingRoom["housekeeping_status"]) => {
    switch (status) {
      case "pending":
        return "Pending Inspection";
      case "inspection":
        return "Inspection in Progress";
      case "cleaning":
        return "Cleaning in Progress";
      default:
        return "Pending";
    }
  };

  return (
    <Card className="border shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Housekeeping
        </CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-gray-500">
            No rooms pending housekeeping
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex justify-between items-center border rounded-md p-3"
              >
                <div>
                  <p className="font-medium">
                    {room.room_number}
                  </p>
                  <p className="text-xs opacity-70">
                    {room.category}
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    Status: {label(room.housekeeping_status)}
                  </p>
                </div>

                {/* Optional action */}
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
