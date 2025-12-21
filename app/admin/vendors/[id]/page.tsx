"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Wallet,
  History,
  ArrowUpRight,
  ArrowDownRight,
  User,
} from "lucide-react";

type LedgerRow = {
  bill_id: string;
  bill_date: string;
  due_date: string | null;
  total: number;
  paid: number;
  balance: number;
  status: string;
};

type Payment = {
  id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
};

export default function VendorHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vendorId = params.id;

  const [vendorName, setVendorName] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;
    loadVendor();
    loadLedger();
  }, [vendorId]);

  /* ================= LOAD VENDOR ================= */

  async function loadVendor() {
    const { data, error } = await supabase
      .from("vendors")
      .select("name")
      .eq("id", vendorId)
      .single();

    if (!error && data) {
      setVendorName(data.name);
    }
  }

  /* ================= LOAD LEDGER ================= */

  async function loadLedger() {
    setLoading(true);

    const { data, error } = await supabase.rpc("vendor_ledger", {
      vendor_uuid: vendorId,
    });

    if (error) {
      console.error("Ledger RPC error", error);
      setLoading(false);
      return;
    }

    setLedger(data || []);

    const paymentMap: Record<string, Payment[]> = {};

    for (const row of data || []) {
      const { data: p } = await supabase
        .from("vendor_bill_payments")
        .select("id, amount, payment_method, paid_at")
        .eq("vendor_bill_id", row.bill_id)
        .order("paid_at", { ascending: false });

      paymentMap[row.bill_id] = p || [];
    }

    setPayments(paymentMap);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor history...</p>
        </div>
      </div>
    );
  }

  const totalBilled = ledger.reduce((s, r) => s + r.total, 0);
  const totalPaid = ledger.reduce((s, r) => s + r.paid, 0);
  const outstanding = ledger.reduce((s, r) => s + r.balance, 0);
  const totalBills = ledger.length;
  const paidBills = ledger.filter(r => r.status === 'paid').length;
  const pendingBills = ledger.filter(r => r.status !== 'paid').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-3.5 w-3.5" />;
      case "partially_paid": return <Clock className="h-3.5 w-3.5" />;
      default: return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-50 text-green-700 border-green-200";
      case "partially_paid": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank': return <CreditCard className="h-3.5 w-3.5" />;
      case 'cash': return <Wallet className="h-3.5 w-3.5" />;
      default: return <DollarSign className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{vendorName}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Vendor Ledger & Payment History
            </p>
          </div>
        </div>
        <Badge variant="outline" className="px-3 py-1.5">
          {totalBills} {totalBills === 1 ? 'Bill' : 'Bills'}
        </Badge>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{totalBilled.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{totalBills} bills</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  ₹{totalPaid.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-green-600">{paidBills} paid</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold mt-2 text-amber-600">
                  ₹{outstanding.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-amber-600">{pendingBills} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Rate</p>
                <p className="text-2xl font-bold mt-2">
                  {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0}%
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <History className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="ledger" className="gap-2">
            <FileText className="h-4 w-4" />
            Bill History
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment History
          </TabsTrigger>
        </TabsList>

        {/* LEDGER TAB */}
        <TabsContent value="ledger" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bill History</CardTitle>
              <CardDescription>
                All bills from this vendor with their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="p-4 text-left font-semibold text-gray-700">Bill Date</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Total</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Paid</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Balance</th>
                        <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r) => {
                        const isOverdue = r.due_date && new Date(r.due_date) < new Date() && r.balance > 0;
                        return (
                          <tr key={r.bill_id} className="border-b hover:bg-gray-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                <span>{r.bill_date}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <CalendarDays className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`} />
                                <div>
                                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                    {r.due_date || "-"}
                                  </span>
                                  {isOverdue && (
                                    <div className="text-xs text-red-500 mt-0.5">Overdue</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                ₹{r.total.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                ₹{r.paid.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className={`flex items-center gap-2 ${r.balance > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}`}>
                                {r.balance > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                ₹{r.balance.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(r.status)} border flex items-center gap-1.5 px-3 py-1.5`}
                              >
                                {getStatusIcon(r.status)}
                                {r.status.replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {ledger.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No bills found</h3>
                    <p className="text-gray-500">This vendor has no bill history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All payments made to this vendor across different bills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(payments).length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No payments found</h3>
                  <p className="text-gray-500">No payment history available for this vendor</p>
                </div>
              ) : (
                Object.entries(payments).map(([billId, pays]) => (
                  <div key={billId} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <h4 className="font-medium">Bill #{billId.slice(0, 8)}</h4>
                        </div>
                        <Badge variant="outline" className="px-2 py-1">
                          {pays.length} {pays.length === 1 ? 'Payment' : 'Payments'}
                        </Badge>
                      </div>
                    </div>
                    
                    {pays.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No payments recorded for this bill
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="p-4 text-left font-medium text-gray-700">Date & Time</th>
                              <th className="p-4 text-left font-medium text-gray-700">Amount</th>
                              <th className="p-4 text-left font-medium text-gray-700">Method</th>
                              <th className="p-4 text-left font-medium text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pays.map((p) => (
                              <tr key={p.id} className="border-b hover:bg-gray-50/50 transition-colors last:border-b-0">
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <div>
                                      <div>{new Date(p.paid_at).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2 text-green-600 font-medium">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    ₹{p.amount.toLocaleString()}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    {getPaymentMethodIcon(p.payment_method)}
                                    <span className="capitalize">{p.payment_method}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Completed
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SUMMARY CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>
            Overall financial summary with this vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Bills:</span>
                <span className="font-medium">{totalBills}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid Bills:</span>
                <span className="font-medium text-green-600">{paidBills}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Bills:</span>
                <span className="font-medium text-amber-600">{pendingBills}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Bill Amount:</span>
                <span className="font-medium">
                  ₹{totalBills > 0 ? (totalBilled / totalBills).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Payment:</span>
                <span className="font-medium text-green-600">
                  ₹{Object.values(payments).flat().length > 0 ? 
                    (totalPaid / Object.values(payments).flat().length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Completion:</span>
                <span className="font-medium">
                  {totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Activity:</span>
                <span className="font-medium">
                  {ledger.length > 0 ? 
                    new Date(Math.max(...ledger.map(r => new Date(r.bill_date).getTime()))).toLocaleDateString() : 
                    'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}