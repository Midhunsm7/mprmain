"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import PurchaseCard from "@/components/purchase/PurchaseCard";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PurchaseRequest = {
  id: string;
  title: string;
  description: string;
  quantity: number;
  estimated_cost: number;
  priority: "low" | "medium" | "high" | "urgent";
  status: "submitted" | "passed_by_accounts" | "approved" | "rejected";
  created_at: string;
  inventory_items?: {
    id: string;
    name: string;
    unit: string;
  };
  requested_by?: {
    name: string;
    role: string;
  };
  department?: string;
  expected_delivery?: string;
};

export default function AccountsPurchases() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    totalCost: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [passNote, setPassNote] = useState("");
  const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_requests")
      .select(`
        *,
        inventory_items(id, name, unit),
        profiles:requested_by(name, role)
      `)
      .in("status", ["submitted", "passed_by_accounts"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
      setFilteredRequests(data);
      
      // Calculate stats
      const pending = data.filter(r => r.status === "submitted").length;
      const passed = data.filter(r => r.status === "passed_by_accounts").length;
      const totalCost = data.reduce((sum, r) => sum + (r.estimated_cost || 0), 0);
      
      setStats({
        total: data.length,
        pending,
        approved: passed,
        totalCost,
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.inventory_items?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(request => request.priority === priorityFilter);
    }
    
    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, priorityFilter, requests]);

  const handlePassRequest = async (requestId: string) => {
    const res = await fetch("/api/purchase-requests/update", {
      method: "POST",
      body: JSON.stringify({
        request_id: requestId,
        action: "pass",
        comments: passNote.trim(),
      }),
    });
    
    const json = await res.json();
    if (!res.ok) {
      alert(`Failed: ${json?.error ?? "Unknown error"}`);
    } else {
      load();
      setIsPassDialogOpen(false);
      setPassNote("");
      setSelectedRequest(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed_by_accounts": return "bg-blue-100 text-blue-800 border-blue-200";
      case "submitted": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && requests.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Purchase Requests</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Review and approve purchase requests from various departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <NotificationBell role="accounts" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-xs text-blue-700 mt-1">All pending requests</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Awaiting Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
            <p className="text-xs text-amber-700 mt-1">Require your attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Passed to Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
            <p className="text-xs text-green-700 mt-1">Ready for admin approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Estimated Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalCost)}</div>
            <p className="text-xs text-purple-700 mt-1">Across all requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by item name, description, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All Status
              </Button>
              <Button
                variant={statusFilter === "submitted" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("submitted")}
                className="gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                New Requests
              </Button>
              <Button
                variant={statusFilter === "passed_by_accounts" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("passed_by_accounts")}
                className="gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Passed to Admin
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Priority: {priorityFilter === "all" ? "All" : priorityFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
                    All Priorities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("urgent")}>
                    <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                    Urgent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
                    <div className="h-2 w-2 rounded-full bg-orange-500 mr-2" />
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredRequests.length}</span> of{" "}
            <span className="font-semibold">{requests.length}</span> requests
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-gray-600"
            >
              Clear search
            </Button>
          )}
        </div>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No requests found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "All purchase requests have been processed"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left Section - Request Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.inventory_items?.name || "Purchase Request"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {request.description}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="font-medium">{request.quantity} {request.inventory_items?.unit || "units"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Estimated Cost</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(request.estimated_cost || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Requested On</p>
                          <p className="font-medium">{formatDate(request.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="font-medium">{request.department || "General"}</p>
                        </div>
                      </div>

                      {request.expected_delivery && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500">Expected Delivery:</span>
                          <span className="font-medium">{formatDate(request.expected_delivery)}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Action */}
                    <div className="lg:w-48 flex lg:flex-col gap-2 lg:justify-center">
                      <Dialog open={isPassDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsPassDialogOpen(false);
                          setSelectedRequest(null);
                          setPassNote("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsPassDialogOpen(true);
                            }}
                            className="w-full gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Pass to Admin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Pass Request to Admin</DialogTitle>
                            <DialogDescription>
                              Add optional notes for the admin about this purchase request.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="rounded-lg bg-gray-50 p-3">
                              <p className="font-medium">{request.inventory_items?.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                              <p className="text-sm text-gray-600">Cost: {formatCurrency(request.estimated_cost || 0)}</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="note">Notes (Optional)</Label>
                              <Textarea
                                id="note"
                                placeholder="Add any notes or instructions for the admin..."
                                value={passNote}
                                onChange={(e) => setPassNote(e.target.value)}
                                rows={3}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsPassDialogOpen(false);
                                setSelectedRequest(null);
                                setPassNote("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => selectedRequest && handlePassRequest(selectedRequest.id)}
                            >
                              Confirm & Pass
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Passing Request */}
      {selectedRequest && (
        <Dialog open={isPassDialogOpen} onOpenChange={setIsPassDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pass Request to Admin</DialogTitle>
              <DialogDescription>
                Add optional notes for the admin about this purchase request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="font-medium">{selectedRequest.inventory_items?.name}</p>
                <p className="text-sm text-gray-600">Quantity: {selectedRequest.quantity}</p>
                <p className="text-sm text-gray-600">Cost: {formatCurrency(selectedRequest.estimated_cost || 0)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Notes (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Add any notes or instructions for the admin..."
                  value={passNote}
                  onChange={(e) => setPassNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPassDialogOpen(false);
                  setSelectedRequest(null);
                  setPassNote("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => handlePassRequest(selectedRequest.id)}>
                Confirm & Pass
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}