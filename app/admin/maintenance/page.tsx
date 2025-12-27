// app/admin/maintenance/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Wrench,
  User,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type MaintenanceRequest = {
  id: string;
  room_number: string;
  room_id: string;
  issue_type: string;
  description: string;
  severity: "minor" | "moderate" | "severe";
  estimated_cost: number;
  actual_cost?: number;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  assigned_to?: string;
  assigned_to_name?: string;
  reported_by?: string;
  created_at: string;
  completed_at?: string;
  photos?: string[];
  admin_notes?: string;
};

type MaintenanceStaff = {
  id: string;
  name: string;
  department: string;
  phone?: string;
};

export default function MaintenanceDashboard() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [staff, setStaff] = useState<MaintenanceStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [assignData, setAssignData] = useState({
    staff_id: "",
    notes: "",
  });
  const [completeData, setCompleteData] = useState({
    actual_cost: "",
    completion_notes: "",
  });
  const [activeTab, setActiveTab] = useState<"pending" | "assigned" | "completed">("pending");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, staffRes] = await Promise.all([
        fetch("/api/maintenance/requests"),
        fetch("/api/maintenance/staff"),
      ]);

      const requestsData = await requestsRes.json();
      const staffData = await staffRes.json();

      setRequests(requestsData.requests || []);
      setStaff(staffData.staff || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load maintenance data");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowAssignModal(true);
    setAssignData({ staff_id: "", notes: "" });
  };

  const assignRequest = async () => {
    if (!selectedRequest || !assignData.staff_id) {
      toast.error("Please select a staff member");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/maintenance/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          staff_id: assignData.staff_id,
          admin_notes: assignData.notes,
        }),
      });

      if (response.ok) {
        toast.success("Request assigned successfully");
        setShowAssignModal(false);
        loadData();
      } else {
        toast.error("Failed to assign request");
      }
    } catch (error) {
      console.error("Error assigning request:", error);
      toast.error("Error assigning request");
    } finally {
      setProcessing(false);
    }
  };

  const openCompleteModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowCompleteModal(true);
    setCompleteData({
      actual_cost: request.estimated_cost?.toString() || "",
      completion_notes: "",
    });
  };

  const completeRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/maintenance/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          actual_cost: parseFloat(completeData.actual_cost) || 0,
          completion_notes: completeData.completion_notes,
        }),
      });

      if (response.ok) {
        toast.success("Request marked as completed");
        setShowCompleteModal(false);
        loadData();
      } else {
        toast.error("Failed to complete request");
      }
    } catch (error) {
      console.error("Error completing request:", error);
      toast.error("Error completing request");
    } finally {
      setProcessing(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      const response = await fetch("/api/maintenance/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });

      if (response.ok) {
        toast.success("Request cancelled");
        loadData();
      } else {
        toast.error("Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Error cancelling request");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-yellow-100 text-yellow-800";
      case "moderate":
        return "bg-orange-100 text-orange-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "pending") return req.status === "pending";
    if (activeTab === "assigned")
      return req.status === "assigned" || req.status === "in_progress";
    if (activeTab === "completed") return req.status === "completed";
    return false;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Maintenance Management
              </h1>
              <p className="text-gray-600">
                Manage damage reports and maintenance requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requests.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {
                    requests.filter(
                      (r) => r.status === "assigned" || r.status === "in_progress"
                    ).length
                  }
                </p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requests.filter((r) => r.status === "completed").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹
                  {requests
                    .filter((r) => r.status === "completed")
                    .reduce((sum, r) => sum + (r.actual_cost || 0), 0)
                    .toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {["pending", "assigned", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Requests</h3>
              <p className="text-gray-600">
                No {activeTab} maintenance requests at the moment
              </p>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">Room {request.room_number}</h3>
                      <Badge className={getSeverityColor(request.severity)}>
                        {request.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-gray-700 leading-relaxed">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>Est: ₹{request.estimated_cost}</span>
                      </div>

                      {request.assigned_to_name && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{request.assigned_to_name}</span>
                        </div>
                      )}

                      {request.photos && request.photos.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <ImageIcon className="h-4 w-4" />
                          <span>{request.photos.length} photo(s)</span>
                        </div>
                      )}
                    </div>

                    {request.admin_notes && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-sm text-blue-900">
                          <strong>Admin Notes:</strong> {request.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {request.status === "pending" && (
                      <>
                        <Button
                          onClick={() => openAssignModal(request)}
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Assign
                        </Button>
                        <Button
                          onClick={() => cancelRequest(request.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {(request.status === "assigned" ||
                      request.status === "in_progress") && (
                      <Button
                        onClick={() => openCompleteModal(request)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}

                    {request.status === "completed" && request.actual_cost && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Actual Cost</p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{request.actual_cost}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Assign Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Maintenance Request</DialogTitle>
            <DialogDescription>
              Assign Room {selectedRequest?.room_number} to a maintenance staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Staff Member *</Label>
              <Select
                value={assignData.staff_id}
                onValueChange={(value) =>
                  setAssignData((prev) => ({ ...prev, staff_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Add any instructions or notes for the staff member..."
                rows={3}
                value={assignData.notes}
                onChange={(e) =>
                  setAssignData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={assignRequest}
              disabled={processing || !assignData.staff_id}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Maintenance Request</DialogTitle>
            <DialogDescription>
              Record the completion details for Room {selectedRequest?.room_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Actual Cost (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={completeData.actual_cost}
                onChange={(e) =>
                  setCompleteData((prev) => ({
                    ...prev,
                    actual_cost: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Completion Notes</Label>
              <Textarea
                placeholder="Describe the work completed and any additional details..."
                rows={3}
                value={completeData.completion_notes}
                onChange={(e) =>
                  setCompleteData((prev) => ({
                    ...prev,
                    completion_notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={completeRequest}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                "Mark as Completed"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}