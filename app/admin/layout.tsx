"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Settings,
  Search,
  DollarSign,
  UserPlus,
  TrendingUp,
  LayoutDashboard,
  CalendarCheck,
  LogOut,
  Package,
  ChefHat,
  Receipt,
  ShoppingCart,
  Users,
  Menu,
  Hotel,
  Activity,
} from "lucide-react";
import { OmniCommandPalette, OmniSource, OmniItem } from "@/components/ui/omni-command-palette";
import { ResortSidebar } from "@/components/ui/ResortSidebar";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Custom sidebar sections for admin panel
  const adminSections = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      options: [
        { name: "Admin Dashboard", link: "/admin", shortcut: "⌘D" },
        { name: "Revenue Overview", link: "/admin/reports/revenue", shortcut: "⌘R" },
        { name: "Restaurant Reports", link: "/admin/reports/restaurant", shortcut: "⌘T" },
      ],
    },
    {
      title: "Guest Management",
      icon: Hotel,
      options: [
        { name: "Bookings", link: "/admin/bookings", shortcut: "⌘B" },
        { name: "Checkout", link: "/admin/checkout", shortcut: "⌘C" },
        { name: "Collections", link: "/admin/collections", shortcut: "⌘L" },
        { name: "Settings", link: "/admin/settings", shortcut: "⌘S" },
      ],
    },
    {
      title: "STORE Management",
      icon: Package,
      options: [
        { name: "Resort Inventory", link: "/admin/inventory", shortcut: "⌘I" },
        { name: "Inventory Requests", link: "/admin/inventory-requests", shortcut: "⌘Q" },
        { name: "Dishes & Recipes", link: "/admin/dishes", shortcut: "⌘S" },
        
        { name: "Purchases", link: "/admin/purchases", shortcut: "⌘P" },
      ],
    },
    {
      title: "Financial Management",
      icon: DollarSign,
      options: [
        { name: "Expenditure", link: "/admin/expenditure", shortcut: "⌘E" },
        { name: "GST Ledger", link: "/admin/gst", shortcut: "⌘G" },
        { name: "Audit Logs", link: "/admin/audit", shortcut: "⌘A" },
      ],
    },
    {
      title: "Staff & HR",
      icon: Users,
      options: [
        { name: "Staff Management", link: "/admin/staff", shortcut: "⌘S" },
        { name: "Staff Meals", link: "/admin/staff-meals", shortcut: "⌘M" },
      ],
    },
    {
      title: "Operations",
      icon: Activity,
      options: [
        { name: "Maintenance", link: "/admin/maintenance", shortcut: "⌘M" },
        { name: "KOT Management", link: "/admin/kot", shortcut: "⌘K" },
        { name: "KOT Bills", link: "/admin/kot/bills", shortcut: "⌘B" },
        { name: "KOT Revenue", link: "/admin/kot/revenue", shortcut: "⌘V" },
      ],
    },
        {
      title: "Vendor Management",
      icon: Package,
      options: [
        
        
        { name: "Vendor Adding", link: "/admin/vendoradding", shortcut: "⌘S" },
        { name: "Vendor Bills", link: "/admin/vendor-bills", shortcut: "⌘V" },
        
      ],
    },
  ];

  // Add loading state for navigation
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setShowLoadingAnimation(true);
    };
    
    const handleComplete = () => {
      setIsLoading(false);
      // Delay hiding animation to ensure smooth transition
      setTimeout(() => setShowLoadingAnimation(false), 500);
    };

    // Simulate loading for initial page load
    if (typeof window !== 'undefined') {
      handleStart();
      const timer = setTimeout(handleComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Command Palette Sources
  const navigationSource: OmniSource = {
    id: "navigation",
    label: "Navigation",
    fetch: (query: string) => {
      const q = query.trim().toLowerCase();
      const items: OmniItem[] = adminSections.flatMap(section =>
        section.options.map(option => ({
          id: `nav-${option.link}`,
          label: option.name,
          subtitle: section.title,
          groupId: "navigation",
          icon: <section.icon className="size-4" />,
          href: option.link,
          pinned: option.link === "/admin",
          keywords: [option.name.toLowerCase(), section.title.toLowerCase(), "page", "navigate"],
        }))
      );

      if (!q) return items;
      return items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.keywords?.some(k => k.includes(q))
      );
    },
  };

  const actionsSource: OmniSource = {
    id: "actions",
    label: "Quick Actions",
    fetch: (query: string) => {
      const q = query.trim().toLowerCase();
      const items: OmniItem[] = [
        {
          id: "action-new-booking",
          label: "Create New Booking",
          subtitle: "Add a new guest reservation",
          groupId: "actions",
          icon: <CalendarCheck className="size-4" />,
          shortcut: ["⌘", "B"],
          href: "/admin/bookings?new=true",
          keywords: ["add", "create", "new", "booking", "reservation"],
        },
        {
          id: "action-checkout",
          label: "Check Out Guest",
          subtitle: "Process guest departure",
          groupId: "actions",
          icon: <LogOut className="size-4" />,
          shortcut: ["⌘", "O"],
          href: "/admin/checkout",
          keywords: ["checkout", "departure", "leave"],
        },
        {
          id: "action-add-inventory",
          label: "Add Inventory Item",
          subtitle: "Register new stock",
          groupId: "actions",
          icon: <Package className="size-4" />,
          href: "/admin/inventory?new=true",
          keywords: ["inventory", "stock", "add", "new"],
        },
        {
          id: "action-create-dish",
          label: "Create New Dish",
          subtitle: "Add menu item",
          groupId: "actions",
          icon: <ChefHat className="size-4" />,
          href: "/admin/dishes?new=true",
          keywords: ["dish", "menu", "food", "create"],
        },
        {
          id: "action-add-staff",
          label: "Add Staff Member",
          subtitle: "Register new employee",
          groupId: "actions",
          icon: <UserPlus className="size-4" />,
          href: "/admin/staff?new=true",
          keywords: ["staff", "employee", "add", "hire"],
        },
        {
          id: "action-new-vendor-bill",
          label: "Create Vendor Bill",
          subtitle: "Add new vendor invoice",
          groupId: "actions",
          icon: <Receipt className="size-4" />,
          href: "/admin/vendor-bills?new=true",
          keywords: ["vendor", "bill", "invoice", "create"],
        },
        {
          id: "action-new-purchase",
          label: "Create Purchase Request",
          subtitle: "Request new purchase",
          groupId: "actions",
          icon: <ShoppingCart className="size-4" />,
          href: "/admin/purchases?new=true",
          keywords: ["purchase", "request", "buy", "order"],
        },
        {
          id: "action-open-settings",
          label: "Open Settings",
          subtitle: "Account and system settings",
          groupId: "actions",
          icon: <Settings className="size-4" />,
          shortcut: ["⌘", ","],
          href: "/admin/settings",
          keywords: ["settings", "preferences", "account", "profile"],
        },
      ];

      if (!q) return items;
      return items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.keywords?.some(k => k.includes(q))
      );
    },
  };

  const quickStatsSource: OmniSource = {
    id: "quick-stats",
    label: "Quick Stats",
    fetch: (query: string) => {
      const q = query.trim().toLowerCase();
      const items: OmniItem[] = [
        {
          id: "stat-revenue",
          label: "View Revenue Reports",
          subtitle: "Financial overview",
          groupId: "quick-stats",
          icon: <DollarSign className="size-4" />,
          href: "/admin/reports",
          keywords: ["revenue", "money", "income", "financial"],
        },
        {
          id: "stat-occupancy",
          label: "Check Occupancy Rate",
          subtitle: "Room status overview",
          groupId: "quick-stats",
          icon: <TrendingUp className="size-4" />,
          href: "/admin",
          keywords: ["occupancy", "rooms", "status"],
        },
        {
          id: "stat-guests",
          label: "Active Guests",
          subtitle: "Current check-ins",
          groupId: "quick-stats",
          icon: <Users className="size-4" />,
          href: "/admin/bookings?filter=active",
          keywords: ["guests", "active", "checked-in"],
        },
        {
          id: "stat-inventory",
          label: "Low Stock Items",
          subtitle: "Inventory alerts",
          groupId: "quick-stats",
          icon: <Package className="size-4" />,
          href: "/admin/inventory?filter=low-stock",
          keywords: ["inventory", "stock", "low", "alert"],
        },
        {
          id: "stat-pending-bills",
          label: "Pending Vendor Bills",
          subtitle: "Unpaid invoices",
          groupId: "quick-stats",
          icon: <Receipt className="size-4" />,
          href: "/admin/vendor-bills?status=unpaid",
          keywords: ["vendor", "bills", "pending", "unpaid"],
        },
      ];

      if (!q) return items;
      return items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.keywords?.some(k => k.includes(q))
      );
    },
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const page = adminSections.flatMap(section => 
      section.options).find(option => option.link === pathname);
    
    if (page) return page.name;
    
    // Handle nested routes
    if (pathname.includes("/admin/vendors/")) return "Vendor Details";
    if (pathname.includes("/admin/staff/")) return "Staff Details";
    if (pathname.includes("/admin/kot/")) return "KOT Management";
    if (pathname.includes("/admin/reports/")) return "Reports";
    if (pathname.includes("/admin/settings")) return "Settings";
    
    return "Admin Dashboard";
  };

  // Handle settings click
  const handleSettingsClick = () => {
    setShowLoadingAnimation(true);
    setTimeout(() => {
      router.push("/admin/settings");
    }, 300);
  };

  // Glassmorphism Menu Button - Only shows when sidebar is closed
  const GlassmorphismMenuButton = () => (
    <AnimatePresence>
      {!sidebarOpen && (
        <motion.button
          key="menu-button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 left-6 z-40 group"
        >
          <div className="relative">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 shadow-lg group-hover:shadow-xl transition-shadow duration-300" />
            
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            
            {/* Button Content */}
            <div className="relative p-3 group-hover:scale-110 transition-transform duration-300">
              <Menu className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" strokeWidth={2} />
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Loading Animation */}
      <AnimatePresence>
        {showLoadingAnimation && (
          <LoadingAnimation />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <OmniCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        sources={[navigationSource, actionsSource, quickStatsSource]}
        placeholder="Search pages, actions, or stats..."
        storageKey="mountainpass:admin:recents"
        showRecents
        showPinnedFirst
        onItemExecuted={(item) => {
          if (item.href) {
            setShowLoadingAnimation(true);
            setTimeout(() => {
              router.push(item.href!);
            }, 300);
          }
        }}
      />

      {/* Glassmorphism Menu Button */}
      <GlassmorphismMenuButton />

      {/* Resort Sidebar */}
      <ResortSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        customSections={adminSections}
        onNavigate={() => {
          setShowLoadingAnimation(true);
          setTimeout(() => {
            setShowLoadingAnimation(false);
          }, 500);
        }}
      />

      {/* Main Content Wrapper */}
      <div className="min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b shadow-sm">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left side - Page Title with spacer */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Spacer for menu button on mobile */}
                <div className="w-14 flex-shrink-0 lg:w-0"></div>
                
                {/* Page Title */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">
                    {getCurrentPageTitle()}
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-600 mt-0.5 truncate hidden sm:block">
                    {pathname === "/admin" 
                      ? "Hotel performance overview" 
                      : pathname === "/admin/settings"
                      ? "Manage account and system settings"
                      : "Premium resort management system"}
                  </p>
                </div>
              </div>
              
              {/* Top Bar Actions */}
              <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
                {/* Command Palette Trigger - Desktop */}
                <button 
                  onClick={() => setCommandOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-600"
                >
                  <Search size={16} />
                  <span className="text-xs text-gray-500">Search...</span>
                  <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 rounded">
                    ⌘K
                  </kbd>
                </button>

                {/* Command Palette Trigger - Mobile */}
                <button 
                  onClick={() => setCommandOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Search size={20} className="text-gray-600" />
                </button>
                
                {/* Notifications */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                  <Bell size={20} className="text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    3
                  </span>
                </button>
                
                {/* Settings Button */}
                <button 
                  onClick={handleSettingsClick}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative group"
                >
                  <Settings size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  {/* Tooltip */}
                  <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Settings
                    </div>
                  </div>
                </button>
                
                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-gray-800">Admin User</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
                    AU
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-4 sm:p-6 lg:p-8">
                {children}
              </div>
            </motion.div>
            
            {/* Footer */}
            <footer className="mt-6 lg:mt-8 text-center text-xs lg:text-sm text-gray-500">
              <p>MountainPass Resort Admin Panel v1.0 • © {new Date().getFullYear()} All rights reserved</p>
              <p className="mt-1">Premium Hospitality Management System</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Floating Gradient Orbs */}
      <motion.div 
        className="fixed top-20 right-8 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none"
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
        className="fixed bottom-20 left-8 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-10 pointer-events-none"
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
    </div>
  );
}