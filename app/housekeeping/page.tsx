"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sparkles,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  SprayCan,
  Loader2,
} from "lucide-react";


type Room = {
  task_id: string;
  room_id: string;
  room_number: string;
  floor: number;
  status: "pending" | "inspection" | "cleaning";
};

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRooms = async () => {
    setLoading(true);
    const res = await fetch("/api/housekeeping/rooms");
    const data = await res.json();
    setRooms(data.rooms || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const startInspection = async (taskId: string) => {
    setProcessing(taskId);
    await fetch("/api/housekeeping/start-inspection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });
    toast.success("Inspection started");
    loadRooms();
    setProcessing(null);
  };

  const markNoDamage = async (taskId: string) => {
    setProcessing(taskId);
    await fetch("/api/housekeeping/inspection-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        damage_found: false,
      }),
    });
    toast.success("No damage reported");
    loadRooms();
    setProcessing(null);
  };

  const markCleaned = async (taskId: string, roomId: string) => {
    setProcessing(taskId);
    await fetch("/api/housekeeping/mark-cleaned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        room_id: roomId,
      }),
    });
    toast.success("Room marked as cleaned");
    loadRooms();
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-10 text-center space-y-4">
          <Sparkles className="w-12 h-12 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold">All Clean!</h2>
          <p className="text-slate-600">
            No rooms pending housekeeping
          </p>
        </Card>
      </div>
    );
  }

  const grouped = rooms.reduce((acc, r) => {
    acc[r.floor] = acc[r.floor] || [];
    acc[r.floor].push(r);
    return acc;
  }, {} as Record<number, Room[]>);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Housekeeping</h1>
            <p className="text-slate-600">
              {rooms.length} rooms awaiting action
            </p>
          </div>
        </div>

        {Object.keys(grouped)
          .sort((a, b) => Number(b) - Number(a))
          .map((floor) => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                <h2 className="text-xl font-bold">
                  Floor {floor}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped[Number(floor)].map((room) => (
                  <Card
                    key={room.task_id}
                    className="p-6 space-y-4 border-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">
                          Room {room.room_number}
                        </p>
                        <p className="text-sm text-slate-500">
                          Status: {room.status}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {room.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Actions */}
                    {room.status === "pending" && (
                      <Button
                        onClick={() => startInspection(room.task_id)}
                        disabled={processing === room.task_id}
                        className="w-full"
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Start Inspection
                      </Button>
                    )}

                    {room.status === "inspection" && (
                      <Button
                        onClick={() => markNoDamage(room.task_id)}
                        disabled={processing === room.task_id}
                        className="w-full"
                      >
                        <SprayCan className="w-4 h-4 mr-2" />
                        No Damage – Start Cleaning
                      </Button>
                    )}

                    {room.status === "cleaning" && (
                      <Button
                        onClick={() =>
                          markCleaned(
                            room.task_id,
                            room.room_id
                          )
                        }
                        disabled={processing === room.task_id}
                        className="w-full"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Cleaned
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
