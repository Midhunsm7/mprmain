"use client";

import { useEffect, useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Download,
  RefreshCw,
  User,
  FileText,
  DollarSign,
  TrendingUp,
  Eye,
  Search,
  Stethoscope,
  Coffee
} from "lucide-react";

interface LeaveRequest {
  id: string;
  staff_id: string;
  reason: string;
  days: number;
  leave_type: string;
  status: string;
  created_at: string;
  hr_remarks?: string;
  admin_remarks?: string;
  lop_days?: number;
  salary_deduction?: number;
  month_year: string;
  staff: {
    name: string;
    department?: string;
    designation?: string;
    salary?: number;
    employee_id?: string;
  };
}

interface LeaveStats {
  total_requests: number;
  pending_hr: number;
  pending_admin: number;
  approved: number;
  rejected: number;
  total_lop_days: number;
  total_salary_deduction: number;
  monthly_summary: Array<{
    month: string;
    total_leaves: number;
    lop_days: number;
    salary_deduction: number;
  }>;
}

export default function AdminLeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // Modal states
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // Form states
  const [remarks, setRemarks] = useState("");
  const [leaveType, setLeaveType] = useState("EL");
  const [lopDays, setLopDays] = useState(0);
  const [salaryDeduction, setSalaryDeduction] = useState(0);

  // Load leave requests
  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leaves');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setLeaveRequests(data.requests);
      setFilteredRequests(data.requests);
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load leave requests';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/leaves/stats');
      const data = await res.json();
      
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    loadStats();
  }, []);

  // Filter requests
  useEffect(() => {
    let filtered = leaveRequests;
    
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.staff.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    if (departmentFilter !== "all") {
      filtered = filtered.filter(request => 
        request.staff.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }
    
    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, departmentFilter, leaveRequests]);

  // Calculate salary deduction
  const calculateSalaryDeduction = (request: LeaveRequest | null, days: number) => {
    if (!request?.staff.salary) return 0;
    
    const dailyRate = request.staff.salary / 30; // Assuming 30 days in a month
    const totalDeduction = dailyRate * days;
    
    return Math.round(totalDeduction);
  };

  // Handle approval
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      // Calculate LOP days based on leave type and available EL
      const availableEL = 4; // This should come from employee's accrued leave balance
      
      let calculatedLopDays = selectedRequest.days;
      let calculatedLeaveType = selectedRequest.leave_type;
      
      // If it's EL but not enough balance, convert to LOP
      if (selectedRequest.leave_type === "EL" && selectedRequest.days > availableEL) {
        calculatedLopDays = selectedRequest.days - availableEL;
        calculatedLeaveType = "LOP";
      }
      
      // Calculate salary deduction for LOP days
      const deduction = calculateSalaryDeduction(selectedRequest, calculatedLopDays);
      
      const res = await fetch('/api/admin/leaves/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: "Approved",
          leave_type: calculatedLeaveType,
          lop_days: calculatedLopDays,
          salary_deduction: deduction,
          remarks,
          approved_by: "admin" // This should be the actual admin ID
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Leave request approved successfully");
      
      setApprovalModalOpen(false);
      setSelectedRequest(null);
      setRemarks("");
      loadLeaveRequests();
      loadStats();
      
      // Update employee's salary with deduction
      await updateSalaryDeduction(selectedRequest.staff_id, deduction);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve leave request';
      toast.error(errorMessage);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      const res = await fetch('/api/admin/leaves/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: "Rejected",
          remarks
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Leave request rejected");
      
      setRejectionModalOpen(false);
      setSelectedRequest(null);
      setRemarks("");
      loadLeaveRequests();
      loadStats();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject leave request';
      toast.error(errorMessage);
    }
  };

  // Update salary deduction
  const updateSalaryDeduction = async (staffId: string, deduction: number) => {
    try {
      await fetch('/api/admin/salary/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          amount: -deduction,
          reason: `Salary deduction for LOP days - Leave ID: ${selectedRequest?.id}`,
          month: new Date().toISOString().slice(0, 7)
        })
      });
    } catch (error) {
      console.error("Failed to update salary:", error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </Badge>;
      case "HR-Approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" /> HR Approved
        </Badge>;
      case "Approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" /> Approved
        </Badge>;
      case "Rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get leave type icon
  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case "EL":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "LOP":
        return <DollarSign className="w-4 h-4 text-red-500" />;
      case "Sick":
        return <Stethoscope className="w-4 h-4 text-purple-500" />;
      case "Casual":
        return <Coffee className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get unique departments
  const departments = Array.from(new Set(
    leaveRequests.map(req => req.staff.department).filter(Boolean)
  ));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-2">
              Approve/reject leave requests and manage LOP calculations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadLeaveRequests} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests}</div>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                {stats.pending_admin} pending admin approval
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                LOP Days This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.total_lop_days}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Across all employees
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Salary Deduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.total_salary_deduction.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Total LOP deduction
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_requests > 0 
                  ? Math.round((stats.approved / stats.total_requests) * 100) 
                  : 0}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.approved} approved out of {stats.total_requests}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, ID or reason..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="HR-Approved">HR Approved</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept || ''} value={dept || ""}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setDepartmentFilter("all");
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            Review and approve leave requests. EL is calculated as 1 day per week.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading leave requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No leave requests</h3>
              <p className="text-gray-500 mt-2">
                {searchQuery || statusFilter !== "all" || departmentFilter !== "all"
                  ? "No results match your filters"
                  : "No leave requests found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>LOP Days</TableHead>
                    <TableHead>Deduction</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{request.staff.name}</div>
                            <div className="text-xs text-gray-500">
                              {request.staff.employee_id} • {request.staff.department}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium text-sm">{request.reason}</div>
                          <div className="text-xs text-gray-500">
                            Applied: {formatDate(request.created_at)}
                          </div>
                          {request.hr_remarks && (
                            <div className="text-xs text-blue-600 mt-1">
                              HR: {request.hr_remarks}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLeaveTypeIcon(request.leave_type)}
                          <span className="text-sm">{request.leave_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.days} days</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.month_year + '-01').toLocaleDateString('en-IN', { 
                            month: 'short',
                            year: 'numeric' 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${request.lop_days ? 'text-red-600' : 'text-green-600'}`}>
                          {request.lop_days || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{request.salary_deduction?.toLocaleString('en-IN') || '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.status === "HR-Approved" && (
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRemarksModalOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="h-8 bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setApprovalModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Approve</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRejectionModalOpen(true);
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reject</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Approve this leave request and set LOP calculations
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <div className="text-sm font-medium">{selectedRequest.staff.name}</div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="text-sm">{selectedRequest.staff.department}</div>
                </div>
              </div>

              <div>
                <Label>Leave Reason</Label>
                <div className="text-sm p-2 bg-gray-50 rounded">{selectedRequest.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Requested Days</Label>
                  <div className="text-sm font-medium">{selectedRequest.days} days</div>
                </div>
                <div>
                  <Label>Salary</Label>
                  <div className="text-sm">
                    ₹{selectedRequest.staff.salary?.toLocaleString('en-IN') || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EL">Earned Leave (EL)</SelectItem>
                    <SelectItem value="LOP">Loss of Pay (LOP)</SelectItem>
                    <SelectItem value="Sick">Sick Leave</SelectItem>
                    <SelectItem value="Casual">Casual Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lopDays">LOP Days (if applicable)</Label>
                <Input
                  id="lopDays"
                  type="number"
                  min="0"
                  max={selectedRequest.days}
                  value={lopDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value) || 0;
                    setLopDays(days);
                    
                    // Calculate salary deduction
                    if (selectedRequest.staff.salary) {
                      const dailyRate = selectedRequest.staff.salary / 30;
                      setSalaryDeduction(Math.round(dailyRate * days));
                    }
                  }}
                />
                <p className="text-xs text-gray-500">
                  Note: 1 EL is earned per week (approx. 4 per month)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryDeduction">Salary Deduction (₹)</Label>
                <Input
                  id="salaryDeduction"
                  type="number"
                  value={salaryDeduction}
                  onChange={(e) => setSalaryDeduction(parseInt(e.target.value) || 0)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add any remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModalOpen(false);
                setSelectedRequest(null);
                setRemarks("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <AlertDialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this leave request?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedRequest && (
            <div className="space-y-2">
              <Label htmlFor="rejectionRemarks">Rejection Remarks</Label>
              <Textarea
                id="rejectionRemarks"
                placeholder="Please provide reason for rejection..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Remarks Modal */}
      <Dialog open={remarksModalOpen} onOpenChange={setRemarksModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Employee</div>
                  <div>{selectedRequest.staff.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Employee ID</div>
                  <div>{selectedRequest.staff.employee_id}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Leave Reason</div>
                <div className="p-2 bg-gray-50 rounded">{selectedRequest.reason}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Requested Days</div>
                  <div>{selectedRequest.days} days</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Leave Type</div>
                  <div>{selectedRequest.leave_type}</div>
                </div>
              </div>

              {selectedRequest.hr_remarks && (
                <div>
                  <div className="text-sm font-medium text-gray-500">HR Remarks</div>
                  <div className="p-2 bg-blue-50 rounded">{selectedRequest.hr_remarks}</div>
                </div>
              )}

              {selectedRequest.admin_remarks && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Admin Remarks</div>
                  <div className="p-2 bg-green-50 rounded">{selectedRequest.admin_remarks}</div>
                </div>
              )}

              {(selectedRequest.lop_days || selectedRequest.salary_deduction) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.lop_days && selectedRequest.lop_days > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">LOP Days</div>
                      <div className="text-red-600">{selectedRequest.lop_days} days</div>
                    </div>
                  )}
                  {selectedRequest.salary_deduction && selectedRequest.salary_deduction > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Salary Deduction</div>
                      <div className="text-red-600">
                        ₹{selectedRequest.salary_deduction.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setRemarksModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}