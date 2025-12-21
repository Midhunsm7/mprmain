"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  CreditCard, 
  Clock, 
  Utensils, 
  Key, 
  AlertTriangle,
  Home,
  Receipt,
  Coffee,
  Bell
} from "lucide-react";

export default function GuestDashboard() {
  const [pin, setPin] = useState("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/guest/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Access screen
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-md mx-auto mt-12 md:mt-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Guest Portal
            </h1>
            <p className="text-slate-600 mt-2">Enter your room PIN to access stay details</p>
          </div>

          <Card className="p-6 md:p-8 bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl rounded-2xl">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Room Access PIN
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    type="password"
                    maxLength={6}
                  />
                  <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                </div>
              </div>

              <Button 
                onClick={load} 
                className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={loading || pin.length < 4}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  "Access Dashboard"
                )}
              </Button>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  Your PIN is provided at check-in. Contact front desk for assistance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard screen
  const { guest, restaurantTotal, account } = data;
  const checkoutTime = new Date(guest.check_out);
  const hoursLeft = (checkoutTime.getTime() - Date.now()) / (1000 * 60 * 60);
  
  const totalAmount = account?.total_amount || 0;
  const dueToday = hoursLeft < 24 ? totalAmount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50/30 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Guest Dashboard</h1>
            </div>
            <p className="text-slate-600">Welcome back, {guest.name}</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-300 hover:bg-white hover:shadow-md"
              onClick={() => {
                setData(null);
                setPin("");
              }}
            >
              Switch Room
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stay Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Checkout Alert */}
            {hoursLeft < 2 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800">Check-out Approaching</h3>
                    <p className="text-sm text-orange-600">Your check-out is in {Math.ceil(hoursLeft * 60)} minutes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stay Details Card */}
            <Card className="rounded-2xl border-slate-200 shadow-lg overflow-hidden bg-white">
              <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Stay Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Guest Name</p>
                      <p className="font-semibold text-slate-800">{guest.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Room PIN</p>
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-slate-100 rounded-lg font-mono text-lg tracking-wider">
                          {guest.room_pin || guest.pin_code}
                        </code>
                        <Key className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Check-in
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(guest.check_in).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(guest.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Check-out
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(guest.check_out).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(guest.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 rounded-xl border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-lg bg-green-100 mb-3">
                    <Coffee className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Room Service</p>
                </div>
              </Card>
              
              <Card className="p-4 rounded-xl border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-lg bg-purple-100 mb-3">
                    <Utensils className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Dine In</p>
                </div>
              </Card>
              
              <Card className="p-4 rounded-xl border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-lg bg-amber-100 mb-3">
                    <Receipt className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Request Bill</p>
                </div>
              </Card>
              
              <Card className="p-4 rounded-xl border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-lg bg-red-100 mb-3">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Late Checkout</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column - Billing Summary */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 shadow-lg bg-gradient-to-b from-white to-slate-50">
              <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Billing Summary</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">Room Charges</span>
                    <span className="font-semibold">₹{account?.base_amount || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> Restaurant
                    </span>
                    <span className="font-semibold">₹{restaurantTotal}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">Extra Charges</span>
                    <span className="font-semibold">₹{account?.extra_charge || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-emerald-600">Discounts</span>
                    <span className="font-semibold text-emerald-600">-₹{account?.discount_amount || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-red-600">Damage Charges</span>
                    <span className="font-semibold text-red-600">₹{account?.damage_charges || 0}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700 font-semibold">Total Amount</span>
                      <span className="text-2xl font-bold text-slate-800">₹{totalAmount}</span>
                    </div>
                    
                    {dueToday > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          Due today: <span className="font-bold">₹{dueToday}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl">
                    Download Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full py-3 rounded-xl border-slate-300 hover:bg-slate-50"
                  >
                    Contact Billing
                  </Button>
                </div>
              </div>
            </Card>

            {/* Time Remaining */}
            <Card className="rounded-2xl border-slate-200 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Stay Duration</h3>
                <Clock className="w-5 h-5" />
              </div>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold">
                  {Math.floor(hoursLeft)}h {Math.floor((hoursLeft % 1) * 60)}m
                </div>
                <p className="text-sm text-blue-100">until check-out</p>
              </div>
              
              <div className="w-full bg-blue-400 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (24 - hoursLeft) / 24 * 100)}%` }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}