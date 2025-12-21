"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CreditCard,
  Bed,
  Wrench,
  Sparkles,
  TrendingUp,
  Clock,
  UserCheck,
  BarChart3,
  RefreshCw,
  Package,
  ChefHat,
  Receipt,
  CalendarCheck,
  LogOut,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Home,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { subscribeToTable } from "@/lib/supabaseRealtime";

interface DashboardData {
  counts: {
    totalRooms: number;
    occupied: number;
    housekeeping: number;
    maintenance: number;
    checkedInGuests: number;
  };
  revenue: {
    total: number;
    today: number;
    monthly: number;
  };
  stats: {
    occupancyRate: number;
    avgStayDuration: number;
    avgRevenuePerRoom: number;
    availableTonight: number;
    avgDailyRate: string;
    revPAR: string;
  };
  quickStats: {
    inventoryItems: number;
    activeDishes: number;
    pendingBills: number;
    todayBookings: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    details: any;
    created_at: string;
    actor_email: string;
  }>;
  recentCheckouts: Array<{
    id: string;
    name: string;
    room_number: string;
    check_out: string;
    total_charge: number;
    payments?: Array<{ total_amount: number }>;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    created_at: string;
    status: string;
  }>;
}

interface PerformanceMetric {
  label: string;
  value: string;
  target: string;
  status: 'exceeded' | 'met' | 'below';
  trend: 'up' | 'down' | 'stable';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const [dashboardRes, performanceRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/performance')
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        if (dashboardData.success) {
          setData(dashboardData.data);
        }
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        if (performanceData.success) {
          setPerformanceMetrics(performanceData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime updates
    const unsubRooms = subscribeToTable("rooms", "ALL", fetchDashboardData);
    const unsubGuests = subscribeToTable("guests", "ALL", fetchDashboardData);
    const unsubPayments = subscribeToTable("payments", "ALL", fetchDashboardData);
    const unsubAudit = subscribeToTable("audit_logs", "ALL", fetchDashboardData);

    return () => {
      unsubRooms();
      unsubGuests();
      unsubPayments();
      unsubAudit();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="relative w-[400px] h-[300px] mx-auto">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/loading-animation.mp4" type="video/mp4" />
            {/* Fallback loading spinner */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
          </video>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600">Please try refreshing the page</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { counts, revenue, stats, quickStats, recentActivities, recentCheckouts } = data;

  const quickStatsCards = [
    {
      title: "Inventory Items",
      value: quickStats.inventoryItems.toString(),
      icon: Package,
      color: "from-blue-500 to-cyan-500",
      change: "+12%",
      changeColor: "text-emerald-600",
      trend: "up"
    },
    {
      title: "Active Dishes",
      value: quickStats.activeDishes.toString(),
      icon: ChefHat,
      color: "from-amber-500 to-orange-500",
      change: "+5%",
      changeColor: "text-emerald-600",
      trend: "up"
    },
    {
      title: "Pending Bills",
      value: quickStats.pendingBills.toString(),
      icon: Receipt,
      color: "from-rose-500 to-pink-500",
      change: "-3%",
      changeColor: "text-rose-600",
      trend: "down"
    },
    {
      title: "Today's Bookings",
      value: quickStats.todayBookings.toString(),
      icon: CalendarCheck,
      color: "from-emerald-500 to-green-500",
      change: "+24%",
      changeColor: "text-emerald-600",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1 sm:mt-2">
            Welcome back! Here's your hotel's performance summary for today
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-medium">Live Updates</span>
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Rooms</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{counts.totalRooms}</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{stats.occupancyRate}% occupied</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Today's Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{revenue.today.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>↑ 8% from yesterday</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Active Guests</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{counts.checkedInGuests}</div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <UserCheck className="h-3 w-3" />
              <span>{counts.occupied} rooms occupied</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ₹{revenue.total.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>↑ 12% this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Room Status & Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Room Status</h2>
                <p className="text-gray-600 text-sm">Current status of all hotel rooms</p>
              </div>
              <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                {counts.totalRooms} Total Rooms
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Bed className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Occupied</div>
                    <div className="text-sm text-gray-600">Guests currently staying</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{counts.occupied}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Available</div>
                    <div className="text-sm text-gray-600">Ready for check-in</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.availableTonight}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Housekeeping</div>
                    <div className="text-sm text-gray-600">Being cleaned</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{counts.housekeeping}</div>
              </div>

              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-lg border border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Wrench className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Maintenance</div>
                    <div className="text-sm text-gray-600">Under repair</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{counts.maintenance}</div>
              </div>
            </div>

            {/* Occupancy Progress */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Occupancy Progress</div>
                <div className="text-sm font-bold text-gray-900">{stats.occupancyRate}%</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.occupancyRate >= 85 ? 'bg-emerald-500' :
                    stats.occupancyRate >= 70 ? 'bg-blue-500' :
                    stats.occupancyRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      metric.status === 'exceeded' ? 'bg-emerald-100 text-emerald-800' :
                      metric.status === 'met' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {metric.status === 'exceeded' ? 'Exceeded' : metric.status === 'met' ? 'On Track' : 'Below Target'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Target: {metric.target}</span>
                    {metric.trend === 'up' ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Above target</span>
                      </div>
                    ) : metric.trend === 'stable' ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <span>On target</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600">
                        <TrendingDown className="h-3 w-3" />
                        <span>Below target</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Alerts */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-600 text-sm">Latest system updates</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>

            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.action.includes('success') || activity.action.includes('completed') ? 'bg-emerald-500' :
                        activity.action.includes('pending') || activity.action.includes('created') ? 'bg-amber-500' :
                        activity.action.includes('error') || activity.action.includes('failed') ? 'bg-rose-500' : 'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {activity.actor_email || 'System'}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {activity.action}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(activity.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => router.push('/admin/audit')}
              className="w-full mt-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              View All Activities
            </button>
          </div>

          {/* Recent Checkouts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Checkouts</h2>
                <p className="text-gray-600 text-sm">Latest departed guests</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <LogOut className="h-5 w-5 text-purple-600" />
              </div>
            </div>

            <div className="space-y-4">
              {recentCheckouts.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent checkouts</p>
                </div>
              ) : (
                recentCheckouts.slice(0, 3).map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{guest.name || 'Guest'}</h4>
                        <p className="text-xs text-gray-500 truncate">
                          Room {guest.room_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        ₹{(guest.total_charge || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {guest.check_out ? new Date(guest.check_out).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>
            <div className="space-y-4">
              {quickStatsCards.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{stat.title}</div>
                      <div className="text-sm text-gray-500">Current count</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                    <div className={`text-xs font-medium ${stat.changeColor}`}>
                      {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ShieldCheck className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">System Status</div>
              <div className="text-xs text-gray-500">All systems operational</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">Updated just now</span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}