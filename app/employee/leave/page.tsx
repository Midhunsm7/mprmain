"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  User,
  FileText,
  BarChart3,
  DollarSign,
  LogOut,
  Key,
  UserCircle,
  Building2,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaveRequest {
  id: string;
  reason: string;
  days: number;
  status: string;
  leave_type: string;
  lop_days?: number;
  salary_deduction?: number;
  created_at: string;
  hr_remarks?: string;
  admin_remarks?: string;
}

interface LeaveStats {
  el_limit: number;
  el_used: number;
  available_el: number;
  total_requests: number;
  approved_requests: number;
  pending_requests: number;
  total_lop_deduction: number;
}

interface EmployeeSession {
  employee_id: string;
  employee_login_id: string;
  name: string;
  department?: string;
  designation?: string;
  logged_in_at: string;
}

export default function EmployeeLeavePage() {
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<EmployeeSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(1);
  const [leaveType, setLeaveType] = useState("EL");

  useEffect(() => {
    checkAuth();
  }, []);

const checkAuth = async () => {
  try {
    console.log("Checking authentication...");
    const res = await fetch('/api/employee/auth/session');
    const data = await res.json();
    
    console.log("Session check response:", {
      status: res.status,
      hasSession: !!data.session,
      error: data.error
    });

    if (res.ok && data.session) {
      setEmployee(data.session);
      setIsAuthenticated(true);
      loadLeaves();
    } else {
      console.log("No valid session, redirecting to login");
      toast.error("Please login to access leave portal", {
        description: data.error || "Session expired",
      });
      router.push(`/employee/login?from=${encodeURIComponent(pathname)}`);
    }
  } catch (error) {
    console.error("Auth check error:", error);
    toast.error("Session expired. Please login again.");
    router.push(`/employee/login?from=${encodeURIComponent(pathname)}`);
  }
};
  const loadLeaves = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/employee/leaves');
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
          router.push('/employee/login');
          return;
        }
        throw new Error(data.error);
      }
      
      setLeaveList(data.leaves || []);
      setStats(data.stats || null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load leave data";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitLeave = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    if (days < 1) {
      toast.error("Invalid number of days");
      return;
    }

    // Check EL balance if applying for EL
    if (leaveType === "EL" && stats && days > stats.available_el) {
      toast.error(`You only have ${stats.available_el} EL days left this month.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reason, 
          days,
          leave_type: leaveType 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
          router.push('/employee/login');
          return;
        }
        throw new Error(data.error);
      }

      toast.success("Leave request submitted successfully", {
        description: "Your leave request has been sent for HR approval",
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      });
      setModalOpen(false);
      setReason("");
      setDays(1);
      setLeaveType("EL");
      loadLeaves(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit leave request";
      toast.error(errorMessage, {
        description: "Please try again or contact HR",
        icon: <XCircle className="h-5 w-5 text-rose-500" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/employee/auth/logout', { method: 'POST' });
      toast.success("Logged out successfully");
      router.push('/employee/login');
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "HR-Approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "HR-Approved":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "Rejected":
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Leave Portal
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-sm text-slate-700 bg-blue-50 px-2 py-1 rounded-full">
                    <UserCircle className="h-3 w-3 text-blue-600" />
                    <span className="font-medium">{employee?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700 bg-emerald-50 px-2 py-1 rounded-full">
                    <Building2 className="h-3 w-3 text-emerald-600" />
                    <span>{employee?.department || "No Department"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700 bg-amber-50 px-2 py-1 rounded-full">
                    <Key className="h-3 w-3 text-amber-600" />
                    <span className="font-mono">{employee?.employee_login_id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <User className="h-3 w-3" />
                <span>Employee Portal</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                EL Balance: {stats?.available_el ?? 0} days remaining
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadLeaves}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </Button>

            <Button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Apply for Leave</span>
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              size="icon"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              EL Balance
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {stats?.available_el ?? 0}
            <span className="text-sm font-normal text-slate-500"> / {stats?.el_limit ?? 4} days</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>1 EL per week</span>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats ? (stats.el_used / stats.el_limit) * 100 : 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Used: {stats?.el_used ?? 0} days</span>
              <span>{stats ? Math.round((stats.el_used / stats.el_limit) * 100) : 0}% utilized</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              Approved
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-700 mb-2">
            {stats?.approved_requests ?? 0}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FileText className="h-4 w-4" />
            <span>Approved requests</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
              Pending
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600 mb-2">
            {stats?.pending_requests ?? 0}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            <span>Requests pending review</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-xl">
              <DollarSign className="h-6 w-6 text-rose-600" />
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-rose-50 text-rose-700 rounded-full">
              LOP Deduction
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-600 mb-2">
            ₹{(stats?.total_lop_deduction ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <DollarSign className="h-4 w-4" />
            <span>Total salary deduction</span>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Leave Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">My Leave Requests</h2>
                    <p className="text-slate-500 text-sm">History of all your leave applications</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                  {loading ? '...' : leaveList.length} requests
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <AnimatePresence>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-slate-200 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : leaveList.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Leave Requests</h3>
                    <p className="text-slate-500 mb-6">You haven't applied for any leave yet</p>
                    <Button
                      onClick={() => setModalOpen(true)}
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      Apply for Leave
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {leaveList.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-slate-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-slate-800 group-hover:text-blue-700">
                                    {request.reason}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {request.leave_type}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-2">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(request.created_at)}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {request.days} {request.days === 1 ? 'day' : 'days'}
                                  </span>
                                  {request.lop_days && request.lop_days > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-rose-600">
                                        <DollarSign className="h-3 w-3" />
                                        {request.lop_days} LOP day{request.lop_days > 1 ? 's' : ''}
                                        {request.salary_deduction && request.salary_deduction > 0 && (
                                          <span className="ml-1">
                                            (₹{request.salary_deduction.toLocaleString('en-IN')})
                                          </span>
                                        )}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {(request.hr_remarks || request.admin_remarks) && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-sm text-slate-600">
                                      {request.hr_remarks && (
                                        <div className="mb-1">
                                          <span className="font-medium text-slate-700">HR:</span> {request.hr_remarks}
                                        </div>
                                      )}
                                      {request.admin_remarks && (
                                        <div>
                                          <span className="font-medium text-slate-700">Admin:</span> {request.admin_remarks}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={`${statusColor(request.status)} px-3 py-1.5 border`}>
                              <div className="flex items-center gap-2">
                                {statusIcon(request.status)}
                                <span>{request.status}</span>
                              </div>
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* LOP Details Card */}
          {leaveList.filter(l => l.lop_days && l.lop_days > 0).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Loss of Pay (LOP) Details
                  </CardTitle>
                  <CardDescription>
                    These leaves will result in salary deduction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaveList
                      .filter(l => l.lop_days && l.lop_days > 0)
                      .map((request) => (
                        <div key={request.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{request.reason}</div>
                              <div className="text-sm text-red-600">
                                {request.lop_days} LOP day{request.lop_days && request.lop_days > 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-700">
                                ₹{request.salary_deduction?.toLocaleString('en-IN') || '0'}
                              </div>
                              <div className="text-sm text-red-600">
                                Salary deduction
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full"
          >
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Leave Summary</h2>
                  <p className="text-slate-500 text-sm">Monthly overview</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-5">
                <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                  <div className="text-sm text-slate-600 mb-2">Current Month</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total EL Limit</span>
                    <span className="font-semibold text-slate-900">{stats?.el_limit ?? 4} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">EL Used</span>
                    <span className="font-semibold text-blue-600">{stats?.el_used ?? 0} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Available EL</span>
                    <span className="font-semibold text-emerald-600">{stats?.available_el ?? 0} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total LOP Days</span>
                    <span className="font-semibold text-rose-600">
                      {leaveList.reduce((sum, l) => sum + (l.lop_days || 0), 0)} days
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Request Status Distribution</div>
                  <div className="space-y-2">
                    {["Approved", "HR-Approved", "Pending", "Rejected"].map(status => {
                      const count = leaveList.filter(l => l.status === status).length;
                      if (count === 0) return null;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon(status)}
                            <span className="text-sm text-slate-700">{status}</span>
                          </div>
                          <span className="font-medium text-slate-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Leave Apply Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Apply for Leave</DialogTitle>
                <DialogDescription className="text-slate-500">
                  Submit a new leave request for approval
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Reason for Leave</label>
              <Textarea 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain the reason for your leave"
                className="min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="EL">Earned Leave (EL)</option>
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="LOP">Loss of Pay (LOP)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Number of Days</label>
              <div className="relative">
                <Input 
                  type="number" 
                  min={1} 
                  value={days} 
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 pl-10 py-6 text-lg"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              {leaveType === "EL" && (
                <p className="text-sm text-slate-500 mt-2">
                  Available EL days: <span className="font-semibold text-emerald-600">{stats?.available_el ?? 0}</span>
                  {stats && days > stats.available_el && (
                    <span className="text-rose-600 ml-2">
                      Warning: {days - stats.available_el} days will be LOP
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700">
                <strong className="flex items-center gap-1 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Important Information:
                </strong>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>1 EL is earned per week (approx. 4 per month)</li>
                  <li>Excess days will be considered as LOP</li>
                  <li>LOP days result in salary deduction</li>
                  <li>Approval workflow: Employee → HR → Admin</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="px-6 py-2.5 border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitLeave}
                disabled={submitting || !reason.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Leave Request"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}