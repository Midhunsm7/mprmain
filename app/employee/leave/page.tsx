"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  User,
  FileText,
  ChevronRight,
  Sparkles,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LeaveRequest {
  id: string;
  reason: string;
  days: number;
  stage: string;
  created_at: string;
  hr_comment?: string;
  admin_comment?: string;
}

export default function EmployeeLeavePage() {
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [leaveLimit, setLeaveLimit] = useState(3);
  const [usedLeave, setUsedLeave] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(1);

  // TODO: Replace with auth later
  const EMPLOYEE_ID = "test-user-123";

  const loadLeaves = async () => {
    setLoading(true);
    try {
const res = await fetch(`/api/hr/leave/list?staff_id=${EMPLOYEE_ID}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setLeaveList(data.leaves || []);

      // Count approved leaves (same month)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const approved = (data.leaves || []).filter(
        (l: any) => l.stage === "Approved" && l.created_at.slice(0, 7) === currentMonth
      );

      setUsedLeave(approved.reduce((sum: number, l: any) => sum + l.days, 0));
    } catch (err: any) {
      toast.error(err.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const submitLeave = async () => {
    if (!reason.trim()) return toast.error("Please enter a reason");
    if (days < 1) return toast.error("Invalid number of days");

    if (usedLeave + days > leaveLimit)
      return toast.error(`You only have ${leaveLimit - usedLeave} leave days left this month.`);

    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/leave/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: EMPLOYEE_ID, reason, days }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Leave request submitted successfully", {
        description: "Your leave request has been sent for approval",
        icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      });
      setModalOpen(false);
      setReason("");
      setDays(1);
      loadLeaves();
    } catch (err: any) {
      toast.error(err.message, {
        description: "Please try again or contact HR",
        icon: <XCircle className="h-5 w-5 text-rose-500" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Pending-Admin":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending-HR":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Rejected-HR":
      case "Rejected-Admin":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "Pending-Admin":
      case "Pending-HR":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "Rejected-HR":
      case "Rejected-Admin":
        return <XCircle className="h-4 w-4 text-rose-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const leavePercentage = (usedLeave / leaveLimit) * 100;
  const availableLeave = leaveLimit - usedLeave;

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
                <p className="text-slate-600 mt-2 text-sm md:text-base">
                  Apply for leave and track your requests in real-time
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <User className="h-3 w-3" />
                <span>Employee Portal</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Leave Balance: {availableLeave} days remaining
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
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
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
              Balance
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {availableLeave}
            <span className="text-sm font-normal text-slate-500"> / {leaveLimit} days</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Leave days remaining</span>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${leavePercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Used: {usedLeave} days</span>
              <span>{Math.round(leavePercentage)}% utilized</span>
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
            {leaveList.filter(l => l.stage === "Approved").length}
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
            {leaveList.filter(l => l.stage.includes("Pending")).length}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle className="h-4 w-4" />
            <span>Requests pending review</span>
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
                                <h4 className="font-semibold text-slate-800 group-hover:text-blue-700">
                                  {request.reason}
                                </h4>
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
                                </div>
                                {(request.hr_comment || request.admin_comment) && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="text-sm text-slate-600">
                                      {request.hr_comment && (
                                        <div className="mb-1">
                                          <span className="font-medium text-slate-700">HR:</span> {request.hr_comment}
                                        </div>
                                      )}
                                      {request.admin_comment && (
                                        <div>
                                          <span className="font-medium text-slate-700">Admin:</span> {request.admin_comment}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={`${statusColor(request.stage)} px-3 py-1.5 border`}>
                              <div className="flex items-center gap-2">
                                {statusIcon(request.stage)}
                                <span>{request.stage}</span>
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
        </div>

        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden h-full">
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
                    <span className="text-slate-600">Total Leave Limit</span>
                    <span className="font-semibold text-slate-900">{leaveLimit} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Leave Used</span>
                    <span className="font-semibold text-blue-600">{usedLeave} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Available Balance</span>
                    <span className="font-semibold text-emerald-600">{availableLeave} days</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500 mb-3">Request Status Distribution</div>
                  <div className="space-y-2">
                    {["Approved", "Pending-Admin", "Pending-HR", "Rejected-HR", "Rejected-Admin"].map(status => {
                      const count = leaveList.filter(l => l.stage === status).length;
                      if (count === 0) return null;
                      
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {statusIcon(status)}
                            <span className="text-sm text-slate-700">{status.replace('-', ' ')}</span>
                          </div>
                          <span className="font-medium text-slate-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <p className="text-sm text-slate-500 mt-2">
                Available leave days: <span className="font-semibold text-emerald-600">{availableLeave}</span>
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Note:</strong> Your leave request will be reviewed by HR and Admin. 
                  You'll receive notifications about the status.
                </div>
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
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}