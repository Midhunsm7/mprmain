// app/kot/components/PinAssignModal.tsx
"use client";

import { useState } from "react";
import { X, Key, User, Home } from "lucide-react";

interface PinAssignModalProps {
  orderId: string;
  onClose: (success?: boolean) => void;
}

export default function PinAssignModal({ orderId, onClose }: PinAssignModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<any>(null);

const verifyPin = async () => {
  if (!pin.trim()) return;
  
  setLoading(true);
  setError(null);
  
  try {
    const res = await fetch("/api/guests/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      setError(data.error || "Invalid PIN or guest not checked-in");
      setGuestInfo(null);
    } else {
      setGuestInfo(data);
    }
  } catch (err) {
    setError("Failed to verify PIN");
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  const assignToRoom = async () => {
    if (!pin.trim() || !guestInfo) return;
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/kot/assign-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, room_pin: pin })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to assign bill");
      } else {
        alert(`✅ Bill assigned to ${guestInfo.name} (Room ${guestInfo.room_number})`);
        onClose(true);
      }
    } catch (err) {
      setError("Failed to assign bill");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Assign Bill to Room</h2>
                <p className="text-sm text-white/80 mt-1">
                  Enter guest's room PIN to assign restaurant charges
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room PIN
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setGuestInfo(null);
                  setError(null);
                }}
                placeholder="Enter 4-digit room PIN"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                maxLength={4}
                disabled={loading}
              />
              <button
                onClick={verifyPin}
                disabled={loading || !pin.trim()}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>

          {/* Guest Info */}
          {guestInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg">
                    {guestInfo.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        Room {guestInfo.room_number}
                      </span>
                    </div>
                    <div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {guestInfo.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => onClose()}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={assignToRoom}
              disabled={loading || !guestInfo}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Assigning..." : "Assign Bill to Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}