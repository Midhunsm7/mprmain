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
  AlertTriangle,
  Camera,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  
  // Damage reporting modal state
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Room | null>(null);
  const [damageReport, setDamageReport] = useState({
    description: "",
    estimatedCost: "",
    severity: "minor" as "minor" | "moderate" | "severe",
    photos: [] as string[],
  });

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
    toast.success("No damage reported - Cleaning can begin");
    loadRooms();
    setProcessing(null);
  };

  const openDamageModal = (room: Room) => {
    setSelectedTask(room);
    setShowDamageModal(true);
    setDamageReport({
      description: "",
      estimatedCost: "",
      severity: "minor",
      photos: [],
    });
  };

  const submitDamageReport = async () => {
    if (!selectedTask || !damageReport.description.trim()) {
      toast.error("Please provide damage description");
      return;
    }

    setProcessing(selectedTask.task_id);

    try {
      const response = await fetch("/api/housekeeping/report-damage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: selectedTask.task_id,
          room_id: selectedTask.room_id,
          room_number: selectedTask.room_number,
          damage_description: damageReport.description,
          estimated_cost: parseFloat(damageReport.estimatedCost) || 0,
          severity: damageReport.severity,
          photos: damageReport.photos,
        }),
      });

      if (response.ok) {
        toast.success("Damage reported successfully");
        setShowDamageModal(false);
        loadRooms();
      } else {
        toast.error("Failed to report damage");
      }
    } catch (error) {
      console.error("Error reporting damage:", error);
      toast.error("Error reporting damage");
    } finally {
      setProcessing(null);
    }
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
          <p className="text-slate-600">No rooms pending housekeeping</p>
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
            <p className="text-slate-600">{rooms.length} rooms awaiting action</p>
          </div>
        </div>

        {Object.keys(grouped)
          .sort((a, b) => Number(b) - Number(a))
          .map((floor) => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-indigo-600" />
                <h2 className="text-xl font-bold">Floor {floor}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped[Number(floor)].map((room) => (
                  <Card key={room.task_id} className="p-6 space-y-4 border-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">Room {room.room_number}</p>
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
                      <div className="space-y-2">
                        <Button
                          onClick={() => markNoDamage(room.task_id)}
                          disabled={processing === room.task_id}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          No Damage – Start Cleaning
                        </Button>
                        <Button
                          onClick={() => openDamageModal(room)}
                          disabled={processing === room.task_id}
                          variant="destructive"
                          className="w-full"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Report Damage
                        </Button>
                      </div>
                    )}

                    {room.status === "cleaning" && (
                      <Button
                        onClick={() => markCleaned(room.task_id, room.room_id)}
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

      {/* Damage Report Modal */}
      <Dialog open={showDamageModal} onOpenChange={setShowDamageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Report Damage - Room {selectedTask?.room_number}
            </DialogTitle>
            <DialogDescription>
              Provide detailed information about the damage found during inspection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Severity Level */}
            <div className="space-y-2">
              <Label>Severity Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {["minor", "moderate", "severe"].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={damageReport.severity === level ? "default" : "outline"}
                    className={
                      damageReport.severity === level
                        ? level === "minor"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : level === "moderate"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-red-600 hover:bg-red-700"
                        : ""
                    }
                    onClick={() =>
                      setDamageReport((prev) => ({
                        ...prev,
                        severity: level as "minor" | "moderate" | "severe",
                      }))
                    }
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Damage Description */}
            <div className="space-y-2">
              <Label htmlFor="damage-description">
                Damage Description *
              </Label>
              <Textarea
                id="damage-description"
                placeholder="Describe the damage in detail (e.g., broken window, stained carpet, damaged furniture...)"
                rows={4}
                value={damageReport.description}
                onChange={(e) =>
                  setDamageReport((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="resize-none"
              />
            </div>

            {/* Estimated Cost */}
            <div className="space-y-2">
              <Label htmlFor="estimated-cost">
                Estimated Repair Cost (₹)
              </Label>
              <Input
                id="estimated-cost"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={damageReport.estimatedCost}
                onChange={(e) =>
                  setDamageReport((prev) => ({
                    ...prev,
                    estimatedCost: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-slate-500">
                Optional: Enter an estimated cost if known
              </p>
            </div>

            {/* Photo Upload Placeholder */}
            <div className="space-y-2">
              <Label>Damage Photos</Label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Camera className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">
                  Photo upload feature coming soon
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Will support uploading multiple damage photos
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDamageModal(false)}
              disabled={processing === selectedTask?.task_id}
            >
              Cancel
            </Button>
            <Button
              onClick={submitDamageReport}
              disabled={
                processing === selectedTask?.task_id ||
                !damageReport.description.trim()
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {processing === selectedTask?.task_id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Submit Damage Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}