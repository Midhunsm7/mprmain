"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coffee, 
  Utensils,
  ShoppingBag,
  Calendar,
  Clock,
  DollarSign,
  RefreshCw,
  Download,
  PieChart,
  BarChart3,
  CreditCard,
  Percent,
  Receipt,
  FileText,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RevenueData {
  period: string;
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    total_bills: number;
    total_revenue: number;
    total_gst: number;
    total_subtotal: number;
    total_service_charge: number;
    total_discount: number;
    net_revenue: number;
  };
  dine_in: {
    bills: number;
    revenue: number;
    subtotal: number;
    gst: number;
    service_charge: number;
    discount: number;
    avg_order_value: number;
    percentage_change: number;
    net_revenue: number;
  };
  takeaway: {
    bills: number;
    revenue: number;
    subtotal: number;
    gst: number;
    service_charge: number;
    discount: number;
    avg_order_value: number;
    percentage_change: number;
    net_revenue: number;
  };
  top_items: Array<{
    name: string;
    revenue: number;
    count: number;
  }>;
  hourly_data?: Array<{
    hour: string;
    dine_in: number;
    takeaway: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  bill_details?: Array<{
    bill_number: string;
    order_type: string;
    subtotal: number;
    discount: number;
    service_charge: number;
    gst: number;
    total: number;
    payment_method: string;
    created_at: string;
  }>;
}

export default function AdminKOTRevenuePage() {
  const [range, setRange] = useState<"today" | "week" | "month" | "custom">("today");
  const [view, setView] = useState<"overview" | "details" | "analytics">("overview");
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  async function loadData(rng: "today" | "week" | "month" | "custom", customParams?: { start: string; end: string }) {
    try {
      setLoading(true);
      
      let url = `/api/admin/kot/revenue?range=${rng}`;
      if (rng === "custom" && customParams) {
        url += `&start=${customParams.start}&end=${customParams.end}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to load data: ${res.status}`);
      }
      
      const json = await res.json();
      setData(json.result);
      
      if (json.message) {
        toast.success(json.message);
      }
    } catch (error: any) {
      console.error("Error loading revenue data:", error);
      toast.error(error.message || "Failed to load revenue data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(range, range === "custom" ? customRange : undefined);
  };

  const handleExport = async () => {
    try {
      toast.loading("Generating report...");
      const response = await fetch(`/api/admin/kot/revenue/export?range=${range}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kot_revenue_${range}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to export report');
    }
  };

  useEffect(() => {
    loadData(range, range === "custom" ? customRange : undefined);
  }, [range]);

  const handleCustomDateSubmit = () => {
    if (!customRange.start || !customRange.end) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (new Date(customRange.start) > new Date(customRange.end)) {
      toast.error("Start date cannot be after end date");
      return;
    }
    loadData("custom", customRange);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Revenue Analytics</h1>
            <p className="text-gray-600 mt-2">
              Detailed KOT bill analysis with GST, service charges, and discounts
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Overview
                  </div>
                </SelectItem>
                <SelectItem value="details">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Bill Details
                  </div>
                </SelectItem>
                <SelectItem value="analytics">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mt-6">
          <Tabs value={range} onValueChange={(value) => setRange(value as any)} className="w-full">
            <TabsList className="grid grid-cols-4 md:w-auto">
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Week
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This Month
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Custom Date Range Selector */}
        {range === "custom" && (
          <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                  className="px-3 py-2 border rounded-md w-full"
                  max={customRange.end}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                  className="px-3 py-2 border rounded-md w-full"
                  min={customRange.start}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button onClick={handleCustomDateSubmit}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          {view === "overview" && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(data.summary.total_revenue)}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {data.summary.total_bills} Bills
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Net: {formatCurrency(data.summary.net_revenue)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Dine-In Revenue */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Utensils className="h-4 w-4" />
                      Dine-In Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(data.dine_in.revenue)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-600">
                        {data.dine_in.bills} bills
                      </div>
                      <div className="flex items-center gap-1">
                        {data.dine_in.percentage_change >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${data.dine_in.percentage_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(data.dine_in.percentage_change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {formatCurrency(data.dine_in.avg_order_value)} per bill
                    </div>
                  </CardContent>
                </Card>

                {/* Takeaway Revenue */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Takeaway Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(data.takeaway.revenue)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm text-gray-600">
                        {data.takeaway.bills} bills
                      </div>
                      <div className="flex items-center gap-1">
                        {data.takeaway.percentage_change >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${data.takeaway.percentage_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(data.takeaway.percentage_change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {formatCurrency(data.takeaway.avg_order_value)} per bill
                    </div>
                  </CardContent>
                </Card>

                {/* GST Collected */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      GST Collected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(data.summary.total_gst)}
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Dine-In</span>
                        <span>{formatCurrency(data.dine_in.gst)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Takeaway</span>
                        <span>{formatCurrency(data.takeaway.gst)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Comparison */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Revenue Breakdown
                    </CardTitle>
                    <CardDescription>Detailed revenue components</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Dine-In Breakdown */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Dine-In</span>
                            <Badge variant="outline">{data.dine_in.bills} bills</Badge>
                          </div>
                          <span className="font-semibold">
                            {((data.dine_in.revenue / data.summary.total_revenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-blue-50 rounded">
                            <div className="text-blue-600">Subtotal</div>
                            <div className="font-semibold">{formatCurrency(data.dine_in.subtotal)}</div>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-green-600">Service</div>
                            <div className="font-semibold">{formatCurrency(data.dine_in.service_charge)}</div>
                          </div>
                          <div className="p-2 bg-amber-50 rounded">
                            <div className="text-amber-600">Discount</div>
                            <div className="font-semibold">{formatCurrency(data.dine_in.discount)}</div>
                          </div>
                          <div className="p-2 bg-purple-50 rounded">
                            <div className="text-purple-600">GST</div>
                            <div className="font-semibold">{formatCurrency(data.dine_in.gst)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Takeaway Breakdown */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-green-500" />
                            <span className="font-medium">Takeaway</span>
                            <Badge variant="outline">{data.takeaway.bills} bills</Badge>
                          </div>
                          <span className="font-semibold">
                            {((data.takeaway.revenue / data.summary.total_revenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-blue-50 rounded">
                            <div className="text-blue-600">Subtotal</div>
                            <div className="font-semibold">{formatCurrency(data.takeaway.subtotal)}</div>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-green-600">Service</div>
                            <div className="font-semibold">{formatCurrency(data.takeaway.service_charge)}</div>
                          </div>
                          <div className="p-2 bg-amber-50 rounded">
                            <div className="text-amber-600">Discount</div>
                            <div className="font-semibold">{formatCurrency(data.takeaway.discount)}</div>
                          </div>
                          <div className="p-2 bg-purple-50 rounded">
                            <div className="text-purple-600">GST</div>
                            <div className="font-semibold">{formatCurrency(data.takeaway.gst)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">Total Subtotal</div>
                            <div className="font-bold text-lg">{formatCurrency(data.summary.total_subtotal)}</div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">Service Charge</div>
                            <div className="font-bold text-lg">{formatCurrency(data.summary.total_service_charge)}</div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">Total Discount</div>
                            <div className="font-bold text-lg">{formatCurrency(data.summary.total_discount)}</div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium">Net Revenue</div>
                            <div className="font-bold text-lg text-green-600">{formatCurrency(data.summary.net_revenue)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.payment_methods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <div className="font-medium text-gray-900 capitalize">{method.method}</div>
                              <div className="text-sm text-gray-500">{method.count} transactions</div>
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(method.amount)}
                          </div>
                        </div>
                      ))}
                      
                      {data.payment_methods.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No payment data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {view === "details" && data.bill_details && data.bill_details.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bill Details
                  <Badge>{data.bill_details.length} bills</Badge>
                </CardTitle>
                <CardDescription>
                  Showing latest {data.bill_details.length} paid bills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Bill No.</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Type</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Date & Time</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Subtotal</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Service</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Discount</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">GST</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Total</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bill_details.map((bill, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-sm">{bill.bill_number}</td>
                          <td className="py-2 px-3">
                            <Badge variant={bill.order_type === "dine_in" ? "default" : "secondary"} className="capitalize">
                              {bill.order_type.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="text-sm">{formatDate(bill.created_at)}</div>
                            <div className="text-xs text-gray-500">{formatTime(bill.created_at)}</div>
                          </td>
                          <td className="py-2 px-3 font-medium">{formatCurrency(bill.subtotal)}</td>
                          <td className="py-2 px-3 text-green-600">{formatCurrency(bill.service_charge)}</td>
                          <td className="py-2 px-3 text-amber-600">{formatCurrency(bill.discount)}</td>
                          <td className="py-2 px-3 text-purple-600">{formatCurrency(bill.gst)}</td>
                          <td className="py-2 px-3 font-bold">{formatCurrency(bill.total)}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="capitalize">
                              {bill.payment_method}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {view === "analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Top Selling Items
                  </CardTitle>
                  <CardDescription>By revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.top_items.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.count} orders</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(item.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg: {formatCurrency(item.revenue / item.count)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {data.top_items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No item sales data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Key Ratios</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">GST Percentage</span>
                          <span className="font-medium">
                            {((data.summary.total_gst / data.summary.total_subtotal) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Charge %</span>
                          <span className="font-medium">
                            {((data.summary.total_service_charge / data.summary.total_subtotal) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount %</span>
                          <span className="font-medium">
                            {((data.summary.total_discount / data.summary.total_subtotal) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Margin</span>
                          <span className="font-medium text-green-600">
                            {((data.summary.net_revenue / data.summary.total_revenue) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Trend Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-blue-500" />
                            <span>Dine-in Growth</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {data.dine_in.percentage_change >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`font-medium ${data.dine_in.percentage_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(data.dine_in.percentage_change).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-green-500" />
                            <span>Takeaway Growth</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {data.takeaway.percentage_change >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`font-medium ${data.takeaway.percentage_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(data.takeaway.percentage_change).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-amber-500" />
                            <span>Avg Bill Value</span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(data.summary.total_revenue / data.summary.total_bills)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Summary Footer */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Period Summary</h4>
                  <p className="text-sm text-gray-600">
                    {data.period} • {formatDate(data.date_range.start)} to {formatDate(data.date_range.end)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className="bg-blue-50">
                    <Utensils className="h-3 w-3 mr-1" />
                    {data.dine_in.bills} Dine-in Bills
                  </Badge>
                  <Badge variant="outline" className="bg-green-50">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    {data.takeaway.bills} Takeaway Bills
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50">
                    <Percent className="h-3 w-3 mr-1" />
                    {formatCurrency(data.summary.total_gst)} GST
                  </Badge>
                  <Badge className="bg-green-600">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatCurrency(data.summary.net_revenue)} Net
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Receipt className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Revenue Data Available</h3>
          <p className="text-gray-500 mb-6">Select a time range to view KOT revenue analytics</p>
          <Button onClick={handleRefresh}>
            Load Data
          </Button>
        </div>
      )}
    </div>
  );
}