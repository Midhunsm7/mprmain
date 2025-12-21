"use client";

import { useEffect, useState, useRef } from "react";
import {
  Hotel,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Sparkles,
  Activity,
  ArrowRight,
  ChefHat,
  FileCheck,
  Bed,
  CheckCircle,
  Coffee,
  ShoppingBag,
  Wifi,
  Car,
  Waves,
  MapPin,
  Bell,
  Settings,
  BarChart3,
  Star,
  Shield,
  Battery,
  Thermometer,
} from "lucide-react";
import gsap from "gsap";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ResortSidebar, MenuButton } from "@/components/ui/ResortSidebar";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardStats {
  occupancy: number;
  revenue_today: number;
  active_guests: number;
  pending_tasks: number;
  available_rooms: number;
  total_rooms: number;
  restaurant_revenue: number;
  checkins_today: number;
  checkouts_today: number;
  average_rating: number;
}

export default function ResortDashboard() {
  const [showLoading, setShowLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredUpdate, setHoveredUpdate] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    occupancy: 0,
    revenue_today: 0,
    active_guests: 0,
    pending_tasks: 0,
    available_rooms: 0,
    total_rooms: 40,
    restaurant_revenue: 0,
    checkins_today: 0,
    checkouts_today: 0,
    average_rating: 4.2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: "Sunny",
    humidity: 65,
    icon: "☀️"
  });

  const loadingRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const statsRef = useRef<HTMLDivElement[]>([]);
  const router = useRouter();

  // ✅ Supabase Authentication Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    checkUser();
  }, [router]);

  // Fetch real-time data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kot_orders' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { data: guests } = await supabase
        .from('guests')
        .select('*')
        .eq('status', 'checked-in');

      const today = new Date().toISOString().split('T')[0];
      const { data: todayRevenue } = await supabase
        .from('accounts')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const { data: kotRevenue } = await supabase
        .from('kot_orders')
        .select('total')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const { data: checkins } = await supabase
        .from('guests')
        .select('*')
        .gte('check_in', `${today}T00:00:00`)
        .lte('check_in', `${today}T23:59:59`);

      const { data: checkouts } = await supabase
        .from('guests')
        .select('*')
        .gte('check_out', `${today}T00:00:00`)
        .lte('check_out', `${today}T23:59:59`);

      const totalRevenue = (todayRevenue || []).reduce((sum, item) => sum + (item.total_amount || 0), 0);
      const restaurantRevenue = (kotRevenue || []).reduce((sum, item) => sum + (item.total || 0), 0);
      const activeGuestsCount = guests?.length || 0;
      const totalRooms = 40;
      const occupancy = Math.round((activeGuestsCount / totalRooms) * 100);
      const pendingTasks = Math.max(0, activeGuestsCount * 2 - 5);

      setStats({
        occupancy,
        revenue_today: totalRevenue,
        active_guests: activeGuestsCount,
        pending_tasks: pendingTasks,
        available_rooms: totalRooms - activeGuestsCount,
        total_rooms: totalRooms,
        restaurant_revenue: restaurantRevenue,
        checkins_today: checkins?.length || 0,
        checkouts_today: checkouts?.length || 0,
        average_rating: 4.2,
      });

      const activities = generateRecentActivities(
        checkins?.length || 0,
        checkouts?.length || 0,
        totalRevenue + restaurantRevenue
      );
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecentActivities = (checkins: number, checkouts: number, revenue: number) => {
    const baseTime = new Date();
    const activities = [];
    
    if (checkins > 0) {
      activities.push({
        time: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `${checkins} new guest check-ins processed`,
        icon: Hotel,
        color: "text-blue-500",
        bgColor: "bg-blue-50"
      });
    }

    if (checkouts > 0) {
      activities.push({
        time: new Date(baseTime.getTime() - 3 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `${checkouts} guest check-outs completed`,
        icon: CheckCircle,
        color: "text-green-500",
        bgColor: "bg-green-50"
      });
    }

    if (revenue > 0) {
      activities.push({
        time: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `Total revenue: ₹${revenue.toLocaleString()}`,
        icon: TrendingUp,
        color: "text-emerald-500",
        bgColor: "bg-emerald-50"
      });
    }

    const staticActivities = [
      {
        time: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: "Kitchen inventory restocked - 15 items",
        icon: ChefHat,
        color: "text-orange-500",
        bgColor: "bg-orange-50"
      },
      {
        time: new Date(baseTime.getTime() - 30 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: "3 vendor invoices approved",
        icon: FileCheck,
        color: "text-purple-500",
        bgColor: "bg-purple-50"
      },
      {
        time: new Date(baseTime.getTime() - 15 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: "Room 204 & 305 maintenance completed",
        icon: Sparkles,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50"
      },
    ];

    return [...activities, ...staticActivities].slice(0, 6);
  };

  // Video loading animation - SIMPLIFIED
  useEffect(() => {
    if (!videoRef.current) return;

    // Set video properties
    const video = videoRef.current;
    video.muted = true;
    video.playsInline = true;
    video.loop = false; // Don't loop
    
    // Try to play the video
    const playVideo = async () => {
      try {
        await video.play();
        
        // Set timer to hide after exactly 5 seconds
        const hideTimeout = setTimeout(() => {
          setShowLoading(false);
        }, 5000); // Exactly 5 seconds

        return () => clearTimeout(hideTimeout);
      } catch (error) {
        console.log("Autoplay prevented, using fallback:", error);
        // If autoplay fails, just hide after 5 seconds
        setTimeout(() => {
          setShowLoading(false);
        }, 5000);
      }
    };

    playVideo();

    // Fallback in case video ends before 5 seconds
    const handleEnded = () => {
      // If video ends but we still have time left in the 5 seconds
      // we'll just keep showing it until the 5 seconds are up
      if (Date.now() - videoStartTime < 5000) {
        video.currentTime = 0;
        video.play().catch(console.error);
      }
    };

    let videoStartTime = Date.now();
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Animate stats on load
  useEffect(() => {
    if (!isLoading && statsRef.current.length > 0) {
      statsRef.current.forEach((ref, index) => {
        if (ref) {
          gsap.from(ref, {
            duration: 0.8,
            y: 20,
            opacity: 0,
            delay: index * 0.1,
            ease: "back.out(1.2)",
          });
        }
      });
    }
  }, [isLoading]);

  // ====================== Dashboard Data ======================
  const quickStats = [
    { 
      label: "Occupancy Rate", 
      value: `${stats.occupancy}%`, 
      change: stats.occupancy > 75 ? "+8%" : "+2%", 
      icon: Hotel, 
      color: "from-cyan-500 to-blue-600",
      gradient: "bg-gradient-to-br",
      details: `${stats.active_guests}/${stats.total_rooms} rooms occupied`
    },
    { 
      label: "Revenue Today", 
      value: `₹${(stats.revenue_today + stats.restaurant_revenue).toLocaleString()}`, 
      change: "+15%", 
      icon: TrendingUp, 
      color: "from-emerald-500 to-green-600",
      gradient: "bg-gradient-to-br",
      details: `₹${stats.revenue_today.toLocaleString()} rooms + ₹${stats.restaurant_revenue.toLocaleString()} restaurant`
    },
    { 
      label: "Active Guests", 
      value: stats.active_guests.toString(), 
      change: `+${stats.checkins_today}`, 
      icon: Users, 
      color: "from-violet-500 to-purple-600",
      gradient: "bg-gradient-to-br",
      details: `${stats.checkins_today} check-ins • ${stats.checkouts_today} check-outs`
    },
    { 
      label: "Available Rooms", 
      value: stats.available_rooms.toString(), 
      change: `${stats.checkouts_today - stats.checkins_today}`, 
      icon: Bed, 
      color: "from-orange-500 to-amber-600",
      gradient: "bg-gradient-to-br",
      details: `${stats.total_rooms} total • ${stats.active_guests} occupied`
    },
  ];

  const facilityStatus = [
    { name: "Restaurant", status: "Open", icon: Coffee, capacity: "85%", color: "bg-emerald-100 text-emerald-700" },
    { name: "Spa & Wellness", status: "Open", icon: Waves, capacity: "60%", color: "bg-blue-100 text-blue-700" },
    { name: "Parking", status: "Available", icon: Car, capacity: "12/40", color: "bg-amber-100 text-amber-700" },
    { name: "WiFi", status: "Excellent", icon: Wifi, capacity: "95%", color: "bg-purple-100 text-purple-700" },
  ];

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Loading Screen with Video - SIMPLIFIED */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            ref={loadingRef}
            className="fixed inset-0 bg-white z-[200] flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Video Container - Maintains original size */}
            <div className="relative w-auto h-auto">
              <video
                ref={videoRef}
                className="w-full h-auto max-w-[90vw] max-h-[90vh]"
                autoPlay
                muted
                playsInline
                preload="auto"
                style={{ objectFit: 'contain' }}
              >
                <source src="/mpass.mp4" type="video/mp4" />
                {/* Fallback text if video doesn't load */}
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Button */}
      {!sidebarOpen && !showLoading && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <MenuButton onClick={() => setSidebarOpen(true)} />
        </motion.div>
      )}

      {/* Sidebar */}
      <ResortSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      {!showLoading && (
        <div className="p-4 sm:p-8 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto mb-12 ml-0 sm:ml-20">
            {/* Header */}
            <motion.div 
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 pb-6 border-b border-gray-200/50 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  Resort Operations Dashboard
                </h1>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600 text-sm flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>Mountain Pass Residency • Live Operations</span>
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-xs text-green-600 font-medium">REALTIME</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                variants={itemVariants}
              >
                {/* Weather Widget */}
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                  <div className="text-3xl">{weather.icon}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-gray-500" />
                      <span className="text-lg font-bold text-gray-900">{weather.temperature}°C</span>
                    </div>
                    <div className="text-xs text-gray-500">{weather.condition}</div>
                  </div>
                </div>
                
                {/* Time Widget */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm">
                  <div className="flex items-center space-x-2 text-blue-900 mb-1">
                    <Calendar className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      {formatDate(currentTime)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <p className="text-lg font-mono font-bold">
                      {formatTime(currentTime)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    ref={(el) => { if (el) statsRef.current[index] = el; }}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    onClick={() => setSelectedMetric(selectedMetric === index ? null : index)}
                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${stat.gradient} ${stat.color} shadow-lg`}
                  >
                    {/* Animated background effect */}
                    <motion.div 
                      className="absolute inset-0 bg-white/10"
                      animate={{ 
                        x: ["0%", "100%"],
                        opacity: [0, 0.2, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                          <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${stat.change.startsWith("+") ? "bg-white/30 text-white" : "bg-red-500/30 text-white"}`}>
                          {stat.change}
                        </span>
                      </div>
                      <p className="text-2xl lg:text-3xl font-bold text-white mb-1">
                        {isLoading ? (
                          <span className="inline-block w-16 h-8 bg-white/30 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-sm text-white/90 font-medium mb-2">
                        {stat.label}
                      </p>
                      <p className="text-xs text-white/70">
                        {stat.details}
                      </p>
                    </div>
                    
                    {/* Hover effect line */}
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/50"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Today's Updates */}
              <motion.div 
                className="lg:col-span-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-white rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <span>Live Activity Feed</span>
                        </h2>
                        <p className="text-sm text-gray-600">Real-time resort operations</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    <AnimatePresence>
                      {recentActivities.length > 0 ? (
                        <div className="space-y-3">
                          {recentActivities.map((update, index) => {
                            const Icon = update.icon;
                            return (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onMouseEnter={() => setHoveredUpdate(index)}
                                onMouseLeave={() => setHoveredUpdate(null)}
                                className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${
                                  hoveredUpdate === index ? "bg-blue-50/50 shadow-md" : "hover:bg-gray-50"
                                }`}
                              >
                                <div className={`p-2.5 rounded-lg ${update.bgColor}`}>
                                  <Icon className={`w-4 h-4 ${update.color}`} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {update.event}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500">{update.time}</p>
                                    <motion.div 
                                      className="w-2 h-2 rounded-full bg-green-500"
                                      animate={{ 
                                        scale: [1, 1.2, 1],
                                        opacity: [1, 0.7, 1]
                                      }}
                                      transition={{ 
                                        duration: 2, 
                                        repeat: Infinity 
                                      }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Loading activities...</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Facility Status */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="bg-white rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden h-full">
                  <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span>Facility Status</span>
                    </h2>
                    <p className="text-sm text-gray-600">Current resort facilities availability</p>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {facilityStatus.map((facility, index) => {
                      const Icon = facility.icon;
                      return (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 hover:border-gray-300 transition-all duration-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${facility.color.split(' ')[0]}`}>
                              <Icon className={`w-4 h-4 ${facility.color.split(' ')[1]}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{facility.name}</p>
                              <p className="text-xs text-gray-500">Capacity: {facility.capacity}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${facility.status === 'Open' || facility.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {facility.status}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Rating and Performance */}
                  <div className="p-4 border-t border-gray-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Guest Satisfaction</p>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(stats.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-sm font-bold text-gray-900 ml-2">{stats.average_rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">98%</p>
                        <p className="text-xs text-gray-500">Satisfaction Rate</p>
                      </div>
                    </div>
                    
                    {/* Performance Meter */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Performance</span>
                        <span>Excellent</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "98%" }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Section - Additional Metrics */}
            <motion.div 
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                variants={itemVariants}
                className="p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50 border border-blue-100/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{stats.restaurant_revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Restaurant Revenue</p>
                  </div>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.restaurant_revenue / 50000) * 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-emerald-100/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
                    <p className="text-xs text-gray-500">Pending Tasks</p>
                  </div>
                </div>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.pending_tasks / 20) * 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-5 rounded-2xl bg-gradient-to-br from-white to-violet-50 border border-violet-100/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₹{(stats.revenue_today / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-gray-500">Avg. Daily Revenue</p>
                  </div>
                </div>
                <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stats.revenue_today / 100000) * 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Floating Elements (only show after loading) */}
      {!showLoading && (
        <>
          <motion.div 
            className="fixed top-20 right-8 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl z-0"
            animate={{
              y: [0, 20, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div 
            className="fixed bottom-20 left-8 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl z-0"
            animate={{
              y: [0, -30, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </>
      )}
    </div>
  );
}