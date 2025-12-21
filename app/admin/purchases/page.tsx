"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PurchaseCard from "@/components/purchase/PurchaseCard";
import RequestModal from "./RequestModal";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronRight,
  BarChart3,
  Download
} from "lucide-react";

const STAGES = [
  { 
    key: "submitted", 
    label: "Submitted", 
    color: "from-blue-500/10 to-blue-600/5",
    borderColor: "border-blue-200",
    countColor: "bg-blue-500",
    icon: "📝"
  },
  { 
    key: "passed_by_accounts", 
    label: "Accounts Review", 
    color: "from-purple-500/10 to-purple-600/5",
    borderColor: "border-purple-200",
    countColor: "bg-purple-500",
    icon: "📊"
  },
  { 
    key: "approved_by_admin", 
    label: "Admin Approval", 
    color: "from-amber-500/10 to-amber-600/5",
    borderColor: "border-amber-200",
    countColor: "bg-amber-500",
    icon: "✅"
  },
  { 
    key: "verified", 
    label: "Verified", 
    color: "from-emerald-500/10 to-emerald-600/5",
    borderColor: "border-emerald-200",
    countColor: "bg-emerald-500",
    icon: "🔒"
  },
  { 
    key: "rejected", 
    label: "Rejected", 
    color: "from-rose-500/10 to-rose-600/5",
    borderColor: "border-rose-200",
    countColor: "bg-rose-500",
    icon: "❌"
  },
];

export default function AdminPurchases() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  async function load() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("purchase_requests")
      .select("*, inventory_items(id,name,unit)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("ADMIN FETCH ERROR:", error);
      setIsLoading(false);
      return;
    }

    setRequests(data || []);
    
    // Calculate statistics
    const total = data?.length || 0;
    const pending = data?.filter(r => r.status === 'submitted' || r.status === 'passed_by_accounts').length || 0;
    const approved = data?.filter(r => r.status === 'verified').length || 0;
    const rejected = data?.filter(r => r.status === 'rejected').length || 0;
    
    setStats({ total, pending, approved, rejected });
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openModal(request: any) {
    setSelected(request);
  }

  // Check if request is editable (not approved or rejected by admin)
  const isRequestEditable = (status: string) => {
    return status !== 'verified' && status !== 'rejected';
  };

  const filteredRequests = requests.filter(request =>
    request.inventory_items?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.id.toString().includes(searchQuery) ||
    request.requester_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Approvals</h1>
            <p className="text-gray-600 mt-2">Review and manage purchase requests from departments</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell role="admin" />
            <Button 
              variant="outline" 
              className="gap-2 border-gray-300 hover:bg-gray-50 transition-all duration-300"
              onClick={load}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Requests", value: stats.total, color: "bg-blue-500", icon: "📋" },
            { label: "Pending Review", value: stats.pending, color: "bg-amber-500", icon: "⏳" },
            { label: "Approved", value: stats.approved, color: "bg-emerald-500", icon: "✅" },
            { label: "Rejected", value: stats.rejected, color: "bg-rose-500", icon: "❌" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl`}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by item name, request ID, or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-300"
              />
            </div>
            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50">
              <BarChart3 className="h-4 w-4" />
              Insights
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Stages Board */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Approval Workflow</h2>
          <div className="flex items-center text-sm text-gray-500">
            <span className="animate-pulse h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            Real-time updates enabled
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 bg-gray-100 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {STAGES.map((stage) => {
              const stageRequests = filteredRequests.filter((r) => r.status === stage.key);
              const count = stageRequests.length;
              
              return (
                <motion.div
                  key={stage.key}
                  variants={cardVariants}
                  whileHover={{ y: -2 }}
                  className={`bg-gradient-to-b ${stage.color} rounded-2xl p-5 border ${stage.borderColor} h-[600px] flex flex-col shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stage.icon}</span>
                      <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    </div>
                    <div className={`${stage.countColor} text-white text-sm font-medium px-3 py-1 rounded-full`}>
                      {count}
                    </div>
                  </div>
                  
                  {/* Scrollable container with fixed height */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                    {stageRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="cursor-pointer group"
                        onClick={() => openModal(request)}
                      >
                        <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 group-hover:border-gray-300 group-hover:shadow-md transition-all duration-300 ${!isRequestEditable(request.status) ? 'opacity-75' : ''}`}>
                          <PurchaseCard request={request} compact />
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-gray-500">
                                {new Date(request.created_at).toLocaleDateString()}
                              </span>
                              {!isRequestEditable(request.status) && (
                                <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                  🔒 Locked
                                </span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {stageRequests.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex items-center justify-center"
                      >
                        <div className="text-center p-6">
                          <div className="text-4xl mb-2">📭</div>
                          <p className="text-gray-400 text-sm">No requests in this stage</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Modal - Pass isEditable prop */}
      <AnimatePresence>
        {selected && (
          <RequestModal
            request={selected}
            onClose={() => { setSelected(null); load(); }}
            isEditable={isRequestEditable(selected.status)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 pt-8 border-t border-gray-200"
      >
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            <p>Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="mt-1">Auto-refresh every 30 seconds</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              Submitted
            </span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              Approved
            </span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500"></div>
              Rejected
            </span>
          </div>
        </div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}