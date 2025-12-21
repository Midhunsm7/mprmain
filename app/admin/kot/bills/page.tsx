"use client";

import { useEffect, useState } from "react";
import { 
  Receipt, 
  Download, 
  Eye, 
  Filter, 
  Search, 
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Printer,
  Users,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { toast } from "sonner";

type KOTBill = {
  id: string;
  bill_number: string;
  subtotal: number;
  gst: number;
  total: number;
  created_at: string;
  payment_method?: string;
  payment_status?: string;
  order?: {
    table_no?: string;
    guest?: {
      name: string;
    };
  };
};

export default function KOTBillsPage() {
  const [bills, setBills] = useState<KOTBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Stats
  const totalBills = bills.length;
  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const averageBill = totalBills > 0 ? totalRevenue / totalBills : 0;
  const todayBills = bills.filter(b => 
    new Date(b.created_at).toDateString() === new Date().toDateString()
  ).length;

  // Fetch bills
  async function loadBills() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kot/bills");
      if (!res.ok) throw new Error("Failed to load bills");
      const data = await res.json();
      setBills(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    loadBills(); 
  }, []);

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.bill_number.toLowerCase().includes(search.toLowerCase()) ||
                         bill.order?.guest?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesPayment = paymentFilter === "all" || 
                          bill.payment_status === paymentFilter ||
                          bill.payment_method === paymentFilter;
    
    const matchesDate = dateFilter === "all" || 
                       (dateFilter === "today" && new Date(bill.created_at).toDateString() === new Date().toDateString()) ||
                       (dateFilter === "week" && 
                        new Date(bill.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesPayment && matchesDate;
  });

  // Get payment status badge
  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "unpaid":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Unpaid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method?: string) => {
    switch (method) {
      case "cash":
        return <Badge variant="outline" className="bg-green-50">Cash</Badge>;
      case "card":
        return <Badge variant="outline" className="bg-blue-50">Card</Badge>;
      case "upi":
        return <Badge variant="outline" className="bg-purple-50">UPI</Badge>;
      default:
        return <Badge variant="outline">{method || "Unknown"}</Badge>;
    }
  };

  // Print bill
  const printBill = async (billId: string) => {
    toast.info("Print feature coming soon!");
    // Implement print functionality
  };

  // View bill details
  const viewBillDetails = async (billId: string) => {
    toast.info("Viewing bill details...");
    // Implement view details functionality
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600" />
            KOT Bills & Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all restaurant bills and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={loadBills} className="gap-2">
            <Eye className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold mt-2">{totalBills}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Bill</p>
                <p className="text-2xl font-bold mt-2">
                  ₹{averageBill.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Bills</p>
                <p className="text-2xl font-bold mt-2">{todayBills}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Bills</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-48"
                />
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading bills...</p>
              </div>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No bills found
              </h3>
              <p className="text-gray-500">
                {search || paymentFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No bills have been generated yet"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Table/Guest</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <motion.tr
                      key={bill.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <div className="font-mono font-bold">{bill.bill_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {bill.order?.table_no ? (
                            <Badge variant="outline">Table {bill.order.table_no}</Badge>
                          ) : (
                            <Badge variant="outline">Takeaway</Badge>
                          )}
                          {bill.order?.guest?.name && (
                            <span className="text-sm text-gray-600">
                              {bill.order.guest.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(bill.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{bill.subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        ₹{bill.gst.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          ₹{bill.total.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getPaymentStatusBadge(bill.payment_status)}
                          {getPaymentMethodBadge(bill.payment_method)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewBillDetails(bill.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printBill(bill.id)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Bills</div>
              <div className="text-2xl font-bold">{filteredBills.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Filtered Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{filteredBills.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Avg. Bill Value</div>
              <div className="text-2xl font-bold">
                ₹{filteredBills.length > 0 
                  ? (filteredBills.reduce((sum, b) => sum + b.total, 0) / filteredBills.length).toFixed(0)
                  : "0"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}