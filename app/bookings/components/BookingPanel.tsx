"use client"

import { Room } from "./RoomGrid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  selectedRooms: Room[]
  total: number
  days: number
  onBook: () => void
  onCheckout: () => void
}

export default function BookingPanel({
  selectedRooms,
  total,
  days,
  onBook,
  onCheckout
}: Props) {
  return (
    <Card className="border border-black shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Selected Rooms
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {selectedRooms.length ? (
          selectedRooms.map((room) => (
            <div
              key={room.id}
              className="flex justify-between border-b border-gray-100 pb-1"
            >
              <span>
                {room.name} ({room.category})
              </span>
              <span>₹{room.pricePerDay}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">
            No rooms selected
          </div>
        )}

        <div className="mt-4 space-y-1 text-center">
          <div className="font-semibold">
            Total: ₹{total.toLocaleString("en-IN")}
          </div>
          <div className="text-xs opacity-70">
            Days: {days}
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          {selectedRooms.length > 0 && (
            <Button
              onClick={onBook}
              className="border border-black bg-white text-black hover:bg-black hover:text-white"
            >
              Check-In Guest
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onCheckout}
            className="border border-black bg-white text-black hover:bg-black hover:text-white"
          >
            Go to Checkout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
