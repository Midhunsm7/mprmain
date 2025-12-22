"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddStaffModal } from "./components/AddStaffModal";
import { EditStaffModal } from "./components/EditStaffModal";
import { UploadDocumentsModal } from "./components/UploadDocumentsModal";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { StaffCard } from "./components/StaffCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  UserPlus, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Shield,
  Sparkles,
  RefreshCw,
  Building,
  BadgePercent,
  Download,
  Edit,
  Filter,
  Search,
  MoreVertical,
  Banknote,
  CreditCard,
  Wallet
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Staff {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  salary: number | null;
  total_salary: number | null;
  joined_at: string | null;
  address: string | null;
  aadhaar_url?: string | null;
  pan_url?: string | null;
  documents?: any;
  upi_id?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  bank_name?: string | null;
  employee_id?: string | null;
  designation?: string | null;
  status?: string;
  profile_picture?: string | null;
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  day: string;
  status: "present" | "absent" | "half" | "leave" | "late";
  note?: string | null;
}

interface DepartmentStats {
  name: string;
  count: number;
  avgSalary: number;
  attendanceRate: number;
}

export default function HRPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [bankingDialogOpen, setBankingDialogOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [newSalary, setNewSalary] = useState<string>("");
  const [salaryReason, setSalaryReason] = useState<string>("");

  // Banking details state
  const [bankingDetails, setBankingDetails] = useState({
    upi_id: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
  });

  // Department statistics
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);

  // Load staff data
  const loadStaff = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/hr/staff/list?${params.toString()}`);
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON response from server");
      }

      if (!res.ok) throw new Error(data.error || "Failed to load staff");
      setStaff(data.staff || []);
      setFilteredStaff(data.staff || []);
      
      // Calculate department statistics
      calculateDepartmentStats(data.staff || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load staff");
      setStaff([]);
      setFilteredStaff([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate department statistics
  const calculateDepartmentStats = (staffList: Staff[]) => {
    const deptMap = new Map<string, { count: number; totalSalary: number; presentCount: number }>();
    
    staffList.forEach(emp => {
      const dept = emp.department || "Unassigned";
      const stats = deptMap.get(dept) || { count: 0, totalSalary: 0, presentCount: 0 };
      
      stats.count++;
      stats.totalSalary += emp.total_salary || emp.salary || 0;
      // Note: You would need attendance data for accurate attendance rate
      // For now, using a placeholder
      stats.presentCount += Math.random() > 0.2 ? 1 : 0; // Placeholder
      
      deptMap.set(dept, stats);
    });

    const statsArray: DepartmentStats[] = [];
    deptMap.forEach((stats, dept) => {
      statsArray.push({
        name: dept,
        count: stats.count,
        avgSalary: stats.count > 0 ? Math.round(stats.totalSalary / stats.count) : 0,
        attendanceRate: stats.count > 0 ? Math.round((stats.presentCount / stats.count) * 100) : 0,
      });
    });

    setDepartmentStats(statsArray.sort((a, b) => b.count - a.count));
  };

  // Filter staff based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStaff(staff);
      return;
    }

    const filtered = staff.filter(employee =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.includes(searchTerm) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredStaff(filtered);
  }, [searchTerm, staff]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStaff(false);
  };

  useEffect(() => {
    loadStaff();
  }, [departmentFilter, statusFilter]);

  const totalEmployees = staff.length;
  const avgSalary =
    staff.length > 0
      ? Math.round(
          staff.reduce((sum, s) => sum + (s.total_salary || s.salary || 0), 0) /
            staff.length
        )
      : 0;

  const departmentCount = staff.reduce((acc, s) => {
    const dept = s.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const [presentToday, setPresentToday] = useState(0);
  const [absentToday, setAbsentToday] = useState(0);

  const refreshTodayStats = async () => {
    try {
      const res = await fetch("/api/hr/attendance/today");
      const data = await res.json();

      const todayRecords = data.attendance ?? [];

      let present = todayRecords.filter((r: any) => r.status === "present").length;
      let absent = todayRecords.filter((r: any) => r.status === "absent").length;

      setPresentToday(present);
      setAbsentToday(absent);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (staff.length) {
      refreshTodayStats();
    } else {
      setPresentToday(0);
      setAbsentToday(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff.length]);

  // Export to Excel
// In the handleExport function, update the toast messages:
const handleExport = async () => {
  try {
    toast.loading("Exporting data...", { id: "export" });
    const response = await fetch('/api/hr/staff/export');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.dismiss("export");
    toast.success('Export completed successfully');
  } catch (err: any) {
    toast.dismiss("export");
    console.error('Export error:', err);
    toast.error(err.message || 'Failed to export data');
  }
};
  const openAttendance = async (s: Staff) => {
    setSelectedStaff(s);
    setAttendance([]);
    setAttendanceDialogOpen(true);
    try {
      const res = await fetch(`/api/hr/attendance/list?staffId=${s.id}&days=30`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load attendance");
      setAttendance(data.attendance || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load attendance");
    }
  };

  const openSalaryDialog = (s: Staff) => {
    setSelectedStaff(s);
    setNewSalary(s.total_salary != null ? String(s.total_salary) : (s.salary != null ? String(s.salary) : ""));
    setSalaryReason("");
    setSalaryDialogOpen(true);
  };

  const openBankingDialog = (s: Staff) => {
    setSelectedStaff(s);
    setBankingDetails({
      upi_id: s.upi_id || "",
      account_number: s.account_number || "",
      ifsc_code: s.ifsc_code || "",
      bank_name: s.bank_name || "",
    });
    setBankingDialogOpen(true);
  };

  const submitSalaryChange = async () => {
    if (!selectedStaff) return;
    if (!newSalary) {
      toast.error("Salary is required");
      return;
    }
    try {
      const payload = {
        staff_id: selectedStaff.id,
        amount: Number(newSalary),
        reason: salaryReason || null,
        created_by: null,
        month: new Date().toISOString().slice(0, 7) // YYYY-MM format
      };

      const res = await fetch("/api/hr/salary/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update salary");

      toast.success("Salary updated successfully");
      setSalaryDialogOpen(false);
      loadStaff();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Salary update failed");
    }
  };

  const submitBankingDetails = async () => {
    if (!selectedStaff) return;
    
    try {
      const res = await fetch("/api/hr/staff/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedStaff.id,
          ...bankingDetails
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update banking details");

      toast.success("Banking details updated successfully");
      setBankingDialogOpen(false);
      loadStaff();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update banking details");
    }
  };

  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(staff.map(s => s.department || "Unassigned")));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6 lg:p-8 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header Section */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  HR Management
                </h1>
                <p className="text-slate-600 mt-2 text-sm md:text-base">
                  Manage employees, attendance, salary, banking details and documents
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Live Dashboard</span>
                <Button
  onClick={() => {
    window.location.href = "/api/google/login";
  }}
>
  Connect Google Drive
</Button>

              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-slate-400">•</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Shield className="h-3 w-3 mr-1" />
                Export Ready
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span className="font-medium">Export Excel</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 border-slate-300 hover:bg-slate-50 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">Refresh</span>
            </Button>

            <Button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-semibold">Add Employee</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search employees by name, ID, department, phone or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 border-slate-300"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="w-48">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="border-slate-300">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-300">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="notice_period">Notice Period</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Employees
              </CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                totalEmployees.toLocaleString()
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? `${filteredStaff.length} filtered` : 'All departments'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Average Salary
              </CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">
              {loading ? (
                <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                `₹${avgSalary.toLocaleString("en-IN")}`
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <span>Monthly CTC</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Today's Attendance
              </CardTitle>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">{presentToday}</span>
                  <span className="text-slate-300">/</span>
                  <span>{totalEmployees}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-500">Present Today</span>
              <Badge variant={attendanceRate >= 80 ? "default" : "destructive"}>
                {attendanceRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-500">
                Active Departments
              </CardTitle>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Building className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <div className="h-10 w-24 bg-slate-200 rounded animate-pulse"></div>
              ) : (
                Object.keys(departmentCount).length
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {departmentStats[0]?.name || 'No'} department largest
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Employees List Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Employee Roster</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    {searchTerm ? `Search results for "${searchTerm}"` : 'All active employees in the system'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-slate-50">
                    {loading ? '...' : filteredStaff.length} staff
                  </Badge>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-slate-200 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {searchTerm ? 'No matching employees' : 'No Employees Found'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm ? 'Try a different search term' : 'Add your first employee to get started'}
                  </p>
                  <Button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <UserPlus className="h-4 w-4" />
                    {searchTerm ? 'Add New Employee' : 'Add First Employee'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStaff.map((s, index) => (
                    <div
                      key={s.id}
                      className="group animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <StaffCard
                        staff={s}
                        onViewAttendance={() => openAttendance(s)}
                        onUploadDocs={() => {
                          setSelectedStaff(s);
                          setUploadOpen(true);
                        }}
                        onEditSalary={() => openSalaryDialog(s)}
                        onEditBanking={() => openBankingDialog(s)}
                        onEdit={() => {
                          setSelectedStaff(s);
                          setEditOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Department Overview & Banking Summary */}
        <div className="space-y-6">
          {/* Department Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                Department Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-slate-200 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : departmentStats.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No department data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {departmentStats.slice(0, 5).map((dept, index) => (
                    <div
                      key={dept.name}
                      className="group p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-800 group-hover:text-purple-700">
                              {dept.name}
                            </h4>
                            <span className="text-sm font-medium text-slate-700">
                              {dept.count} employees
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Avg: ₹{dept.avgSalary.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Attendance: {dept.attendanceRate}%
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                Banking Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">UPI Enabled</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {staff.filter(s => s.upi_id).length}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Employees</p>
                  </div>
                  
                  <div className="p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Bank Accounts</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-900">
                      {staff.filter(s => s.account_number).length}
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">Employees</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Action Required</h4>
                  <div className="space-y-2">
                    {staff
                      .filter(s => !s.account_number && !s.upi_id)
                      .slice(0, 3)
                      .map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                          <span className="text-sm text-slate-600">{s.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStaff(s);
                              openBankingDialog(s);
                            }}
                          >
                            Add Banking
                          </Button>
                        </div>
                      ))}
                    
                    {staff.filter(s => !s.account_number && !s.upi_id).length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-slate-500"
                        onClick={() => {
                          // Show all employees missing banking details
                          const missingBanking = staff.filter(s => !s.account_number && !s.upi_id);
                          toast.info(`${missingBanking.length} employees need banking details`);
                        }}
                      >
                        + {staff.filter(s => !s.account_number && !s.upi_id).length - 3} more
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddStaffModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={loadStaff}
      />

      <EditStaffModal
        open={editOpen}
        onOpenChange={setEditOpen}
        staff={selectedStaff}
        onUpdated={loadStaff}
      />

      <UploadDocumentsModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        staffId={selectedStaff?.id ?? null}
      />

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Attendance Record – {selectedStaff?.name || "Employee"}
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">30-day attendance history</p>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <AttendanceCalendar attendance={attendance as any} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Salary Edit Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <DialogTitle>Salary Adjustment</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Update salary for {selectedStaff?.name}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">New Salary (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                <Input
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="pl-10 py-6 text-lg border-slate-300 focus:border-slate-900 focus:ring-slate-900 rounded-xl"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Total CTC including all allowances and deductions
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Adjustment Reason (Optional)</Label>
              <Input
                value={salaryReason}
                onChange={(e) => setSalaryReason(e.target.value)}
                placeholder="Performance review, promotion, correction..."
                className="py-6 border-slate-300 focus:border-slate-900 focus:ring-slate-900 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSalaryDialogOpen(false)}
                className="px-6 py-2.5 border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitSalaryChange}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banking Details Dialog */}
      <Dialog open={bankingDialogOpen} onOpenChange={setBankingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Banking Details</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">Update banking information for {selectedStaff?.name}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">UPI ID</Label>
              <Input
                value={bankingDetails.upi_id}
                onChange={(e) => setBankingDetails({...bankingDetails, upi_id: e.target.value})}
                placeholder="example@upi"
                className="py-3"
              />
              <p className="text-xs text-slate-500 mt-1">For instant salary transfers</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Account Number</Label>
              <Input
                value={bankingDetails.account_number}
                onChange={(e) => setBankingDetails({...bankingDetails, account_number: e.target.value})}
                placeholder="123456789012"
                className="py-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">IFSC Code</Label>
                <Input
                  value={bankingDetails.ifsc_code}
                  onChange={(e) => setBankingDetails({...bankingDetails, ifsc_code: e.target.value})}
                  placeholder="SBIN0001234"
                  className="py-3"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Bank Name</Label>
                <Input
                  value={bankingDetails.bank_name}
                  onChange={(e) => setBankingDetails({...bankingDetails, bank_name: e.target.value})}
                  placeholder="State Bank of India"
                  className="py-3"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setBankingDialogOpen(false)}
                className="px-6 py-2.5 border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitBankingDetails}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                Save Banking Details
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