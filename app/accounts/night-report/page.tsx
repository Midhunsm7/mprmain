"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  CreditCard,
  Wallet,
  Smartphone,
  Hotel,
  Moon,
  TrendingUp,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  Home,
  BarChart3,
} from "lucide-react";

type NightAudit = {
  id: string;
  audit_date: string;
  total_room_revenue: number;
  total_payments: number;
  pending_amount: number;
  cash_total: number;
  bank_total: number;
  upi_total: number;
  occupied_rooms: number;
  vacant_rooms: number;
  created_at: string;
};

export default function NightReportPage() {
  const [audits, setAudits] = useState<NightAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("night_audits")
      .select("*")
      .order("audit_date", { ascending: false });

    if (!error && data) {
      setAudits(data);
    }

    setLoading(false);
  };

  const toggleExpand = (auditId: string) => {
    setExpandedAudit(expandedAudit === auditId ? null : auditId);
  };

  const exportReport = () => {
    // Implement export functionality
    console.log("Exporting report...");
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading night audit reports...</p>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <Moon className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Night Audits Found</h3>
        <p className="text-gray-500 mb-6">Night audit reports will appear here once generated</p>
        <Button onClick={loadAudits} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Night Audit Reports</h1>
          <p className="text-muted-foreground mt-2">
            Daily financial summaries and occupancy reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('detailed')}
            >
              Detailed
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button onClick={loadAudits} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportReport} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {audits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold mt-2">
                    ₹{audits.reduce((sum, audit) => sum + audit.total_room_revenue, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{audits.length} audit periods</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Occupancy</p>
                  <p className="text-2xl font-bold mt-2">
                    {Math.round(audits.reduce((sum, audit) => {
                      const totalRooms = audit.occupied_rooms + audit.vacant_rooms;
                      return totalRooms > 0 ? sum + (audit.occupied_rooms / totalRooms * 100) : sum;
                    }, 0) / audits.length)}%
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Hotel className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Average across all audits</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold mt-2">
                    ₹{audits.reduce((sum, audit) => sum + audit.total_payments, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">All payment methods</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                  <p className="text-2xl font-bold mt-2 text-amber-600">
                    ₹{audits.reduce((sum, audit) => sum + audit.pending_amount, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Outstanding amount</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Reports */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audits.map((audit) => (
            <Card 
              key={audit.id} 
              className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => toggleExpand(audit.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-lg">{formatDate(audit.audit_date)}</CardTitle>
                  </div>
                  <Badge variant="outline" className="px-2 py-1">
                    {getDayOfWeek(audit.audit_date)}
                  </Badge>
                </div>
                <CardDescription>
                  Generated at {new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Revenue Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Room Revenue</span>
                      </div>
                      <span className="font-bold">₹{audit.total_room_revenue.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Payments</span>
                        <span className="font-medium text-green-600">₹{audit.total_payments.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="font-medium text-amber-600">₹{audit.pending_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Methods</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm">Cash</span>
                        </div>
                        <span className="text-sm font-medium">₹{audit.cash_total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm">Bank</span>
                        </div>
                        <span className="text-sm font-medium">₹{audit.bank_total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm">UPI</span>
                        </div>
                        <span className="text-sm font-medium">₹{audit.upi_total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Occupancy</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {audit.occupied_rooms} / {audit.occupied_rooms + audit.vacant_rooms}
                        </div>
                        <div className="text-xs text-gray-500">
                          {audit.vacant_rooms} vacant
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(audit.occupied_rooms / (audit.occupied_rooms + audit.vacant_rooms)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-center">
                  <Button variant="ghost" size="sm" className="gap-2">
                    {expandedAudit === audit.id ? 'Show Less' : 'View Details'}
                    {expandedAudit === audit.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => (
            <Card key={audit.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Moon className="h-5 w-5 text-gray-400" />
                      <CardTitle className="text-xl">Night Audit Report</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{formatDate(audit.audit_date)}</span>
                      </div>
                      <Badge variant="outline" className="px-2 py-1">
                        {getDayOfWeek(audit.audit_date)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Generated at {new Date(audit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Insights
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Financial Summary */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        Financial Summary
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Total Room Revenue</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                              ₹{audit.total_room_revenue.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <Hotel className="h-6 w-6 text-green-600" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Total Payments</p>
                            <p className="text-xl font-bold text-blue-600 mt-2">
                              ₹{audit.total_payments.toLocaleString('en-IN')}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">Collected amount</div>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Pending Amount</p>
                            <p className="text-xl font-bold text-amber-600 mt-2">
                              ₹{audit.pending_amount.toLocaleString('en-IN')}
                            </p>
                            <div className="text-xs text-gray-500 mt-1">Outstanding balance</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <Wallet className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">Cash</p>
                              <p className="text-xs text-gray-500">Physical currency</p>
                            </div>
                          </div>
                          <p className="font-bold">₹{audit.cash_total.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <CreditCard className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">Bank Transfer</p>
                              <p className="text-xs text-gray-500">Online transactions</p>
                            </div>
                          </div>
                          <p className="font-bold">₹{audit.bank_total.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded">
                              <Smartphone className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">UPI</p>
                              <p className="text-xs text-gray-500">Digital payments</p>
                            </div>
                          </div>
                          <p className="font-bold">₹{audit.upi_total.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy & Summary */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-500" />
                        Room Occupancy
                      </h3>
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-3xl font-bold">{audit.occupied_rooms}</p>
                            <p className="text-sm text-gray-600">Occupied Rooms</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{audit.vacant_rooms}</p>
                            <p className="text-sm text-gray-600">Vacant Rooms</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold">{audit.occupied_rooms + audit.vacant_rooms}</p>
                            <p className="text-sm text-gray-600">Total Rooms</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Occupancy Rate</span>
                            <span className="font-medium">
                              {Math.round((audit.occupied_rooms / (audit.occupied_rooms + audit.vacant_rooms)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full" 
                              style={{ 
                                width: `${(audit.occupied_rooms / (audit.occupied_rooms + audit.vacant_rooms)) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            Occupancy Revenue: ₹{(audit.total_room_revenue / audit.occupied_rooms || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} per room
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{(audit.total_room_revenue / audit.occupied_rooms || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Avg. Revenue per Room</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            ₹{(audit.total_payments / (audit.cash_total + audit.bank_total + audit.upi_total) * 100 || 0).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Payment Efficiency</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {Math.round((audit.bank_total + audit.upi_total) / audit.total_payments * 100)}%
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Digital Payments</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">
                            {audit.pending_amount > 0 ? '₹' + audit.pending_amount.toLocaleString('en-IN') : '0'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Outstanding</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <div>
            Showing <span className="font-medium">{audits.length}</span> night audit reports
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Occupancy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}