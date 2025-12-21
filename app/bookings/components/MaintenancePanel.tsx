"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { Room } from "./RoomGrid"

interface Props {
  rooms: Room[]  // 🔥 NEW
  refreshRooms: () => void // 🔥 NEW
}

export default function MaintenancePanel({ rooms, refreshRooms }: Props) {

  const maintenanceRooms = rooms.filter(r => r.status === "maintenance")

  const setFree = async (id: string) => {
    await supabase.from("rooms")
      .update({ status: "free" })
      .eq("id", id)

    refreshRooms()   // 🔥 instantly re-fetch from parent
  }

  return (
    <Card className="border border-black shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Maintenance Rooms</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        {maintenanceRooms.length === 0 && (
          <p className="text-sm text-gray-500">No rooms under maintenance.</p>
        )}

        {maintenanceRooms.map(room => (
          <div
            key={room.id}
            className="flex items-center justify-between border-b pb-2"
          >
            <span className="font-medium">{room.name}</span>

            <Button
              size="sm"
              className="border border-black bg-white text-black hover:bg-black hover:text-white"
              onClick={() => setFree(room.id)}
            >
              Mark As Free
            </Button>
          </div>
        ))}

      </CardContent>
    </Card>
  )
}
