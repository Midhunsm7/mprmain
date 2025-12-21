"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Coffee,
  Save,
  RefreshCw,
  TrendingUp,
  Building,
  BarChart3,
  Download,
  Filter,
  CheckSquare,
  ChevronRight,
  Sparkles
} from "lucide-react";

type Staff = {
  id: string;
  name: string;
  department: string | null;
  email?: string | null;
  phone?: string | null;
};

type AttendanceRow = {
  staff_id: string;
  status: "present" | "absent" | "half" | "leave" | "late";
  note?: string;
};

type StatusCount = {
  present: number;
  absent: number;
  late: number;
  half: number;
  leave: number;
};

export default function AttendancePage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<Record<string, AttendanceRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusCount, setStatusCount] = useState<StatusCount>({
    present: 0,
    absent: 0,
    late: 0,
    half: 0,
    leave: 0,
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/staff/list");
      const data = await res.json();
      const staff = data.staff || [];
      setStaffList(staff);

      // Initialize default status as "present"
      const initial = Object.fromEntries(
        staff.map((s: Staff) => [
          s.id,
          { staff_id: s.id, status: "present" } as AttendanceRow,
        ])
      );
      setAttendance(initial);
      
      // Calculate initial counts
      updateStatusCount(initial, staff);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const updateStatusCount = (attendanceData: Record<string, AttendanceRow>, staff: Staff[]) => {
    const counts: StatusCount = {
      present: 0,
      absent: 0,
      late: 0,
      half: 0,
      leave: 0,
    };
    
    staff.forEach(staff => {
      const status = attendanceData[staff.id]?.status;
      if (status && counts.hasOwnProperty(status)) {
        counts[status as keyof StatusCount]++;
      }
    });
    
    setStatusCount(counts);
  };

  const saveAttendance = async () => {
    setSaving(true);
    const payload = {
      date: selectedDate,
      records: Object.values(attendance),
    };

    try {
      const res = await fetch("/api/hr/attendance/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Attendance saved successfully", {
          description: `Attendance recorded for ${new Date(selectedDate).toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`,
          icon: <CheckCircle className="h-5 w-5" />,
        });
      } else {
        throw new Error("Failed to save attendance");
      }
    } catch (err) {
      toast.error("Error saving attendance", {
        description: "Please try again or contact support",
        icon: <XCircle className="h-5 w-5" />,
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = (id: string, value: AttendanceRow["status"]) => {
    setAttendance((prev) => {
      const updated = {
        ...prev,
        [id]: { ...prev[id], status: value },
      };
      updateStatusCount(updated, staffList);
      return updated;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-emerald-500";
      case "absent": return "bg-rose-500";
      case "late": return "bg-amber-500";
      case "half": return "bg-blue-500";
      case "leave": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4" />;
      case "absent": return <XCircle className="h-4 w-4" />;
      case "late": return <Clock className="h-4 w-4" />;
      case "half": return <Coffee className="h-4 w-4" />;
      case "leave": return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present": return "Present";
      case "absent": return "Absent";
      case "late": return "Late";
      case "half": return "Half Day";
      case "leave": return "On Leave";
      default: return "Present";
    }
  };

  const filteredStaff = departmentFilter === "all" 
    ? staffList 
    : staffList.filter(staff => staff.department === departmentFilter);

  const uniqueDepartments = Array.from(new Set(staffList.map(s => s.department).filter(Boolean))) as string[];
  const attendanceRate = staffList.length > 0 
    ? Math.round(((statusCount.present + statusCount.late + statusCount.half) / staffList.length) * 100)
    : 0;

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    updateStatusCount(attendance, staffList);
  }, [attendance, staffList.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6 lg:p-8">
      {/* Animated Background Elements */}
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
                <CheckSquare className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Attendance Management
                </h1>
                <p className="text-slate-600 mt-2 text-sm md:text-base">
                  Mark and track employee attendance with real-time statistics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Live Dashboard</span>
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Selected: {new Date(selectedDate).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchStaff}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </Button>

            <Button
              onClick={saveAttendance}
              disabled={saving || staffList.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span className="font-semibold">{saving ? "Saving..." : "Save Attendance"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        {Object.entries(statusCount).map(([status, count]) => (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (["present", "absent", "late", "half", "leave"].indexOf(status) + 1) }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${getStatusColor(status)} bg-opacity-10 rounded-lg`}>
                <div className={`p-2 rounded-md ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{count}</div>
                <div className="text-sm text-slate-500 capitalize">{getStatusLabel(status)}</div>
              </div>
            </div>
          </motion.div>
        ))}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <div className="text-sm text-slate-300">Attendance Rate</div>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-300 opacity-80" />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Attendance Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Mark Attendance</h2>
                    <p className="text-slate-500 text-sm">Update attendance status for each employee</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Date:</label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[160px] border-slate-300">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <AnimatePresence>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-slate-200 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredStaff.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Employees Found</h3>
                    <p className="text-slate-500 mb-6">
                      {departmentFilter !== "all" 
                        ? `No employees in ${departmentFilter} department`
                        : "No employees available"
                      }
                    </p>
                    {departmentFilter !== "all" && (
                      <Button
                        onClick={() => setDepartmentFilter("all")}
                        variant="outline"
                        className="mx-auto"
                      >
                        View All Departments
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {filteredStaff.map((staff, index) => (
                      <motion.div
                        key={staff.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 group-hover:text-blue-700">
                              {staff.name}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {staff.department || "No Department"}
                              </span>
                              {staff.email && (
                                <span className="hidden sm:inline">• {staff.email}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Select
                          value={attendance[staff.id]?.status}
                          onValueChange={(v) => updateStatus(staff.id, v as AttendanceRow["status"])}
                        >
                          <SelectTrigger className="w-[140px] border-slate-300 group-hover:border-blue-400">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(attendance[staff.id]?.status || 'present')}`}></div>
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present" className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              Present
                            </SelectItem>
                            <SelectItem value="absent" className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-rose-500" />
                              Absent
                            </SelectItem>
                            <SelectItem value="late" className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-amber-500" />
                              Late
                            </SelectItem>
                            <SelectItem value="half" className="flex items-center gap-2">
                              <Coffee className="h-4 w-4 text-blue-500" />
                              Half Day
                            </SelectItem>
                            <SelectItem value="leave" className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-purple-500" />
                              Leave
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {filteredStaff.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-6 border-t border-slate-200"
                >
                  <Button
                    onClick={saveAttendance}
                    disabled={saving || staffList.length === 0}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-3">
                      {saving ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span className="font-semibold">Saving Attendance...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span className="font-semibold">Save Attendance for {filteredStaff.length} Employees</span>
                        </>
                      )}
                    </div>
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Date Summary Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Attendance Summary</h3>
                  <p className="text-slate-500 text-sm">For {new Date(selectedDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Employees</span>
                  <span className="font-semibold text-slate-900">{staffList.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Attendance Rate</span>
                  <span className="font-semibold text-emerald-600">{attendanceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Absent Rate</span>
                  <span className="font-semibold text-rose-600">
                    {staffList.length > 0 ? Math.round((statusCount.absent / staffList.length) * 100) : 0}%
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500 mb-2">Status Distribution</div>
                  <div className="space-y-2">
                    {Object.entries(statusCount).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                          <span className="text-sm text-slate-700 capitalize">{status}</span>
                        </div>
                        <span className="font-medium text-slate-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Department Filter Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Department Overview</h3>
                <p className="text-slate-300 text-sm">Filtered by department</p>
              </div>
              <Building className="h-6 w-6 text-blue-300" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Selected Department</span>
                <span className="font-semibold">
                  {departmentFilter === "all" ? "All Departments" : departmentFilter}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Showing Employees</span>
                <span className="font-semibold">{filteredStaff.length} of {staffList.length}</span>
              </div>
              {departmentFilter !== "all" && (
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-sm text-slate-300 mb-2">Department Stats</div>
                  <div className="flex items-center justify-between">
                    <span>Present in Dept</span>
                    <span className="text-emerald-300 font-semibold">
                      {filteredStaff.filter(s => attendance[s.id]?.status === "present").length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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