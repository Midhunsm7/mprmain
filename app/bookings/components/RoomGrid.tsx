"use client"

import { cn } from "@/lib/utils"
import { useState, useRef } from "react"

/* ================= TYPES ================= */

export interface Room {
  id: string
  name: string
  category:
    | "Deluxe"
    | "Executive"
    | "Premium"
    | "Suite"
    | "Deluxe Non AC"
    | "Handicap"
  status: string
  pricePerDay: number
  guestId?: string | null
  current_guest_id?: string | null
  pin?: string | null
}

interface RoomGridProps {
  rooms: Room[]
  selectedRooms: Room[]
  guests: Array<{ 
    id: string; 
    name: string;
    status: string;
    room_ids?: string[];
  }>
  onRoomClick: (room: Room) => void
  onStatusChange: (roomId: string, status: string) => void
  onSelectionChange?: (rooms: Room[]) => void
}

/* ================= STATUS CONFIG ================= */

const statusConfig = {
  free: {
    container: "bg-green-100 border-green-400 hover:bg-green-200 cursor-pointer",
    border: "border-green-500",
    badge: "bg-green-600 text-white",
    text: "text-green-900",
    label: "V&C",
    description: "Vacant & Clean",
  },
  occupied: {
    container: "bg-red-100 border-red-400 cursor-not-allowed",
    border: "border-red-500",
    badge: "bg-red-600 text-white",
    text: "text-red-900",
    label: "OCC",
    description: "Occupied",
  },
  maintenance: {
    container: "bg-amber-900/10 border-amber-800/50 cursor-pointer",
    border: "border-amber-800",
    badge: "bg-amber-800 text-white",
    text: "text-amber-900",
    label: "OOO",
    description: "Out of Order",
  },
  housekeeping: {
    container: "bg-yellow-100 border-yellow-400 hover:bg-yellow-200 cursor-pointer",
    border: "border-yellow-500",
    badge: "bg-yellow-600 text-white",
    text: "text-yellow-900",
    label: "V&D",
    description: "Vacant & Dirty",
  },
}

/* ================= COMPONENT ================= */

export default function RoomGrid({
  rooms,
  selectedRooms,
  guests,
  onRoomClick,
  onStatusChange,
  onSelectionChange,
}: RoomGridProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)
  const [showMaintenanceMenu, setShowMaintenanceMenu] = useState<string | null>(null)
  
  const gridRef = useRef<HTMLDivElement>(null)
  
  // Filter checked-in guests only
  const checkedInGuests = guests.filter(g => g.status === "checked-in")
  
  // Sort rooms
  const sortedRooms = [...rooms].sort((a, b) => {
    const numA = Number(a.name.replace(/\D/g, ""))
    const numB = Number(b.name.replace(/\D/g, ""))
    return numA - numB
  })

  // Helper function to get room status - SIMPLIFIED VERSION
  const getRoomStatus = (room: Room): string => {
    // Use the status already calculated in BookingsPage
    return room.status || "free"
  }

  // Get selectable rooms (free only)
  const selectableRooms = sortedRooms.filter(room => getRoomStatus(room) === "free")

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.room-card')) {
      setIsSelecting(true)
      const rect = gridRef.current?.getBoundingClientRect()
      if (!rect) return
      
      setSelectionBox({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionBox) return
    
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setSelectionBox({
      ...selectionBox,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    })
  }

  const handleMouseUp = () => {
    if (!isSelecting || !selectionBox || !gridRef.current) {
      setIsSelecting(false)
      setSelectionBox(null)
      return
    }

    const x1 = Math.min(selectionBox.startX, selectionBox.currentX)
    const x2 = Math.max(selectionBox.startX, selectionBox.currentX)
    const y1 = Math.min(selectionBox.startY, selectionBox.currentY)
    const y2 = Math.max(selectionBox.startY, selectionBox.currentY)

    const selectedRoomElements = gridRef.current.querySelectorAll('.room-card')
    const newlySelectedRooms: Room[] = []

    selectedRoomElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const gridRect = gridRef.current!.getBoundingClientRect()
      
      const elementX = rect.left - gridRect.left
      const elementY = rect.top - gridRect.top
      const elementWidth = rect.width
      const elementHeight = rect.height

      const overlaps = !(
        elementX > x2 ||
        elementX + elementWidth < x1 ||
        elementY > y2 ||
        elementY + elementHeight < y1
      )

      if (overlaps) {
        const roomId = element.getAttribute('data-room-id')
        const room = selectableRooms.find(r => r.id === roomId)
        if (room && !selectedRooms.some(selected => selected.id === room.id)) {
          newlySelectedRooms.push(room)
        }
      }
    })

    if (newlySelectedRooms.length > 0 && onSelectionChange) {
      onSelectionChange([...selectedRooms, ...newlySelectedRooms])
    }

    setIsSelecting(false)
    setSelectionBox(null)
  }

  const handleRoomClick = (room: Room, e: React.MouseEvent) => {
    const roomStatus = getRoomStatus(room)
    
    // Only allow clicking on free rooms
    if (roomStatus !== "free") {
      return
    }

    e.stopPropagation()
    
    if (onSelectionChange) {
      const isSelected = selectedRooms.some(r => r.id === room.id)
      if (isSelected) {
        onSelectionChange(selectedRooms.filter(r => r.id !== room.id))
      } else {
        onSelectionChange([...selectedRooms, room])
      }
    } else {
      onRoomClick(room)
    }
  }

  const handleRightClick = (room: Room, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMaintenanceMenu(room.id)
  }

  const toggleMaintenance = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return
    
    const currentStatus = getRoomStatus(room)
    
    if (currentStatus === "maintenance") {
      // Change from maintenance to free
      onStatusChange(roomId, "free")
    } else {
      // Change to maintenance (only if room is free)
      if (currentStatus === "free") {
        onStatusChange(roomId, "maintenance")
      }
    }
    setShowMaintenanceMenu(null)
  }

  const getStatusLabel = (room: Room) => {
    const status = getRoomStatus(room)
    
    if (status === "housekeeping") {
      return "V&D"
    } else if (status === "free") {
      return "V&C"
    } else if (status === "maintenance") {
      return "OOO"
    } else if (status === "occupied") {
      return "OCC"
    }
    return "V&C"
  }

  const getStatusDescription = (room: Room) => {
    const status = getRoomStatus(room)
    
    if (status === "housekeeping") {
      return "Vacant & Dirty"
    } else if (status === "free") {
      return "Vacant & Clean"
    } else if (status === "maintenance") {
      return "Out of Order"
    } else if (status === "occupied") {
      return "Occupied"
    }
    return "Vacant & Clean"
  }

  // Calculate stats for debug
  const freeRooms = rooms.filter(r => getRoomStatus(r) === "free").length
  const occupiedRooms = rooms.filter(r => getRoomStatus(r) === "occupied").length
  const maintenanceRooms = rooms.filter(r => getRoomStatus(r) === "maintenance").length
  const housekeepingRooms = rooms.filter(r => getRoomStatus(r) === "housekeeping").length

  return (
    <div className="space-y-4">
      {/* Status Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-green-100 border-2 border-green-400"></div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800">V&C</div>
            <div className="text-slate-600 text-xs">Vacant & Clean</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-100 border-2 border-red-400"></div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800">OCC</div>
            <div className="text-slate-600 text-xs">Occupied</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-yellow-100 border-2 border-yellow-400"></div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800">V&D</div>
            <div className="text-slate-600 text-xs">Vacant & Dirty</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-900/10 border-2 border-amber-800/50"></div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800">OOO</div>
            <div className="text-slate-600 text-xs">Out of Order</div>
          </div>
        </div>
      </div>

      {/* Debug Info - Updated */}
      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold">Free Rooms:</span>
            <span>{freeRooms}</span>
          </div>
          <div className="h-4 w-px bg-blue-300"></div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Occupied:</span>
            <span>{occupiedRooms}</span>
          </div>
          <div className="h-4 w-px bg-blue-300"></div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Housekeeping:</span>
            <span>{housekeepingRooms}</span>
          </div>
          <div className="h-4 w-px bg-blue-300"></div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Maintenance:</span>
            <span>{maintenanceRooms}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-semibold">Left Click:</span>
            <span>Select free rooms</span>
          </div>
          <div className="h-4 w-px bg-amber-300"></div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Right Click:</span>
            <span>Toggle maintenance mode</span>
          </div>
          <div className="h-4 w-px bg-amber-300"></div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Drag:</span>
            <span>Select multiple free rooms</span>
          </div>
        </div>
      </div>

      {/* Room Grid Container */}
      <div 
        ref={gridRef}
        className="relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Selection Box Overlay */}
        {selectionBox && isSelecting && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-200/20 z-30 pointer-events-none"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
            }}
          />
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {sortedRooms.map((room) => {
            const roomStatus = getRoomStatus(room)
            const isSelected = selectedRooms.some((r) => r.id === room.id)
            const config = statusConfig[roomStatus] ?? statusConfig.free

            const canSelect = roomStatus === "free"
            const statusLabel = getStatusLabel(room)
            const statusDescription = getStatusDescription(room)

            return (
              <div
                key={room.id}
                data-room-id={room.id}
                className="room-card relative"
                onClick={(e) => handleRoomClick(room, e)}
                onContextMenu={(e) => handleRightClick(room, e)}
              >
                <div className={cn(
                  "relative rounded-lg p-3 min-h-[120px] flex flex-col justify-between transition-all duration-200 border-2",
                  config.container,
                  config.border,
                  isSelected && "ring-2 ring-blue-500 ring-offset-2 scale-[1.02]",
                  canSelect && "cursor-pointer hover:shadow-md",
                  !canSelect && "cursor-not-allowed"
                )}>
                  {/* Room Number */}
                  <div className="flex justify-between items-start">
                    <div
                      className={cn(
                        "text-2xl font-black",
                        config.text
                      )}
                    >
                      {room.name}
                    </div>
                    {/* Occupied Indicator */}
                    {roomStatus === "occupied" && (
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    )}
                  </div>

                  {/* Status Display */}
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center w-16 py-2 rounded-lg text-sm font-bold",
                          config.badge
                        )}
                      >
                        {statusLabel}
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 font-medium text-center">
                      {statusDescription}
                    </div>
                  </div>

                  {/* Price and Category */}
                  <div className="space-y-1">
                    <div className="text-center">
                      <div className="text-lg font-bold text-slate-800">
                        ₹{room.pricePerDay.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-slate-600">
                        per night
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-700 text-center">
                      {room.category}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Maintenance Toggle Menu */}
                  {showMaintenanceMenu === room.id && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-40">
                      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3">
                        <div className="text-sm font-medium text-slate-800 mb-2">
                          Set room status for {room.name}
                        </div>
                        <div className="space-y-1">
                          <button
                            onClick={() => toggleMaintenance(room.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors",
                              roomStatus === "maintenance"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            )}
                          >
                            {roomStatus === "maintenance"
                              ? "✓ Mark as Ready (V&C)"
                              : "✗ Mark as Out of Order (OOO)"}
                          </button>
                          {roomStatus === "occupied" && (
                            <button
                              disabled
                              className="w-full text-left px-3 py-2 rounded text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
                            >
                              Cannot modify occupied room
                            </button>
                          )}
                          {roomStatus === "housekeeping" && (
                            <button
                              disabled
                              className="w-full text-left px-3 py-2 rounded text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
                            >
                              Clean room first to modify status
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Rooms Summary */}
      {selectedRooms.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-blue-800 font-bold">
                {selectedRooms.length} room{selectedRooms.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-blue-600 ml-2 text-sm">
                {selectedRooms.map(r => r.name).join(', ')}
              </span>
            </div>
            <div className="text-blue-800 font-bold">
              Total: ₹{selectedRooms.reduce((sum, room) => sum + room.pricePerDay, 0).toLocaleString("en-IN")}
              <span className="text-blue-600 text-sm font-normal ml-1">/night</span>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close maintenance menu */}
      {showMaintenanceMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowMaintenanceMenu(null)}
        />
      )}
    </div>
  )
}