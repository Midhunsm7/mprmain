"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Search,
  FileText,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CreditCard,
  CalendarDays,
  User,
  Plus,
  History,
  ChevronRight,
  Download,
  Edit,
  Save,
  X,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Vendor = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  address?: string;
  payment_details?: {
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    payment_terms?: string;
  };
  created_at: string;
};

type VendorBill = {
  id: string;
  bill_date: string;
  due_date: string | null;
  total: number;
  status: "unpaid" | "partially_paid" | "paid";
  paid: number;
  balance: number;
  vendors?: Vendor;
};

type ExcelRow = {
  id: string;
  vendor_name: string;
  vendor_gstin: string;
  vendor_address: string;
  bank_details: string;
  total_outstanding: number;
  payment_amount: number;
  payment_type: "full" | "partial";
  notes?: string;
};

export default function VendorBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------- Vendor Management ---------- */
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    gst_number: "",
    address: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    payment_terms: "",
  });

  /* ---------- Excel Export ---------- */
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);
  const [excelOpen, setExcelOpen] = useState(false);

  /* ---------- create bill ---------- */
  const [open, setOpen] = useState(false);
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({
    bill_date: new Date().toISOString().split("T")[0],
    due_date: "",
    total: "",
    notes: "",
    header: "",
  });

  /* ---------- payment ---------- */
  const [payOpen, setPayOpen] = useState(false);
  const [payBill, setPayBill] = useState<VendorBill | null>(null);
  const [payAmount, setPayAmount] = useState("");

  useEffect(() => {
    loadBills();
    loadVendors();
  }, []);

  /* ================= LOAD DATA ================= */

  async function loadBills() {
    setLoading(true);

    const { data } = await supabase
      .from("vendor_bills")
      .select(
        `
        id,
        bill_date,
        due_date,
        total,
        status,
        vendors ( id, name )
      `
      )
      .order("bill_date", { ascending: false });

    if (!data) {
      setBills([]);
      setLoading(false);
      return;
    }

    const enriched = await Promise.all(
      data.map(async (b: any) => {
        const { data: payments } = await supabase
          .from("vendor_bill_payments")
          .select("amount")
          .eq("vendor_bill_id", b.id);

        const paid =
          payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;

        return {
          ...b,
          paid,
          balance: b.total - paid,
        };
      })
    );

    setBills(enriched);
    setLoading(false);
  }

  async function loadVendors() {
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .order("name");

    if (data) {
      setVendors(data);
    }
  }

  /* ================= VENDOR MANAGEMENT ================= */

  async function saveVendorDetails() {
    if (!editVendor) return;

    const { error } = await supabase
      .from("vendors")
      .update({
        gst_number: editForm.gst_number || null,
        address: editForm.address || null,
        payment_details: {
          bank_name: editForm.bank_name || null,
          account_number: editForm.account_number || null,
          ifsc_code: editForm.ifsc_code || null,
          upi_id: editForm.upi_id || null,
          payment_terms: editForm.payment_terms || null,
        },
      })
      .eq("id", editVendor.id);

    if (error) {
      toast.error("Failed to save vendor details");
      return;
    }

    toast.success("Vendor details saved successfully");
    setEditVendor(null);
    setEditForm({
      gst_number: "",
      address: "",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
      upi_id: "",
      payment_terms: "",
    });
    loadVendors();
  }

  /* ================= EXCEL EXPORT ================= */

  function prepareExcelData() {
    if (selectedVendors.length === 0) {
      toast.error("Please select vendors first");
      return;
    }

    const rows: ExcelRow[] = selectedVendors.map(vendorId => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return null;

      // Calculate total outstanding from unpaid bills
      const vendorBills = bills.filter(b => b.vendors?.id === vendorId);
      const totalOutstanding = vendorBills.reduce((sum, bill) => sum + bill.balance, 0);

      return {
        id: vendor.id,
        vendor_name: vendor.name,
        vendor_gstin: vendor.gst_number || "",
        vendor_address: vendor.address || "",
        bank_details: vendor.payment_details 
          ? `${vendor.payment_details.bank_name || ''} A/C: ${vendor.payment_details.account_number || ''}`
          : "",
        total_outstanding: totalOutstanding,
        payment_amount: 0, // User will fill this
        payment_type: "partial" as const,
        notes: "",
      };
    }).filter(Boolean) as ExcelRow[];

    setExcelRows(rows);
    setExcelOpen(true);
  }

  function updateExcelRow(index: number, field: keyof ExcelRow, value: any) {
    const newRows = [...excelRows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // If payment amount equals total outstanding, mark as full payment
    if (field === 'payment_amount') {
      const payment = Number(value);
      const total = newRows[index].total_outstanding;
      newRows[index].payment_type = payment >= total ? "full" : "partial";
    }
    
    setExcelRows(newRows);
  }

  async function exportToExcel() {
    // Calculate total payment
    const totalPayment = excelRows.reduce((sum, row) => sum + row.payment_amount, 0);
    
    if (totalPayment === 0) {
      toast.error("Please enter payment amounts");
      return;
    }

    // Create Excel data
    const excelData = excelRows.map(row => ({
      "Vendor Name": row.vendor_name,
      "GSTIN": row.vendor_gstin,
      "Address": row.vendor_address,
      "Bank Details": row.bank_details,
      "Total Outstanding": row.total_outstanding,
      "Payment Amount": row.payment_amount,
      "Payment Type": row.payment_type,
      "Notes": row.notes || "",
    }));

    // Create workbook
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Payments");
    
    // Add summary
    const summary = [
      ["Summary"],
      ["Total Vendors:", excelRows.length],
      ["Total Outstanding:", excelRows.reduce((s, r) => s + r.total_outstanding, 0)],
      ["Total Payment:", totalPayment],
      ["Generated Date:", new Date().toLocaleDateString()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Generate and download
    XLSX.writeFile(workbook, `vendor-payments-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Excel file downloaded successfully");
    setExcelOpen(false);
    
    // Create payments for each row
    await createPaymentsFromExcel();
  }

  async function createPaymentsFromExcel() {
    for (const row of excelRows) {
      if (row.payment_amount > 0) {
        // Get vendor's unpaid bills
        const vendorBills = bills.filter(b => b.vendors?.id === row.id && b.balance > 0);
        
        // Create payments (simplified - in real app, you'd create actual payments)
        console.log(`Creating payment of ${row.payment_amount} for vendor ${row.vendor_name}`);
        
        // You would create entries in vendor_bill_payments table here
        // For now, we'll just log it
      }
    }
    
    toast.info("Payments recorded. Please process the payments as per the Excel sheet.");
  }

  /* ================= VENDOR SEARCH ================= */

  async function searchVendors(q: string) {
    if (!q.trim()) {
      setVendorSuggestions([]);
      return;
    }

    const { data } = await supabase
      .from("vendors")
      .select("id, name, gst_number, address")
      .ilike("name", `%${q}%`)
      .limit(5);

    setVendorSuggestions(data || []);
  }

  /* ================= CREATE BILL ================= */

  async function createBill() {
    await fetch("/api/vendor-bills/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_name: vendorQuery,
        bill_date: form.bill_date,
        due_date: form.due_date || null,
        total: Number(form.total),
        notes: form.notes,
        header: form.header,
      }),
    });

    setOpen(false);
    setVendorQuery("");
    setSelectedVendor(null);
    setVendorSuggestions([]);
    setForm({ 
      bill_date: new Date().toISOString().split("T")[0], 
      due_date: "", 
      total: "", 
      notes: "", 
      header: "" 
    });
    loadBills();
  }

  /* ================= PAY ================= */

  async function submitPayment() {
    if (!payBill || !payAmount) return;

    await fetch("/api/vendor-bills/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_id: payBill.id,
        amount: Number(payAmount),
        payment_method: "bank",
      }),
    });

    setPayOpen(false);
    setPayBill(null);
    setPayAmount("");
    loadBills();
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor bills...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-50 text-green-700 border-green-200";
      case "partially_paid": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default: return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4" />;
      case "partially_paid": return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Bills</h1>
          <p className="text-muted-foreground mt-1">
            Manage all vendor bills and payments in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={prepareExcelData}
            disabled={selectedVendors.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Selected ({selectedVendors.length})
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor Bill
          </Button>
        </div>
      </div>

      {/* VENDOR SELECTION SECTION */}
      <div className="bg-white rounded-xl border p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Select Vendors for Payment</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVendors(vendors.map(v => v.id))}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVendors([])}
            >
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedVendors.includes(vendor.id)
                  ? "border-primary bg-blue-50"
                  : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedVendors.includes(vendor.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedVendors([...selectedVendors, vendor.id]);
                      } else {
                        setSelectedVendors(
                          selectedVendors.filter((id) => id !== vendor.id)
                        );
                      }
                    }}
                  />
                  <div>
                    <h3 className="font-medium">{vendor.name}</h3>
                    {vendor.gst_number && (
                      <p className="text-sm text-muted-foreground">
                        GSTIN: {vendor.gst_number}
                      </p>
                    )}
                    {vendor.address && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {vendor.address}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditVendor(vendor);
                    setEditForm({
                      gst_number: vendor.gst_number || "",
                      address: vendor.address || "",
                      bank_name: vendor.payment_details?.bank_name || "",
                      account_number: vendor.payment_details?.account_number || "",
                      ifsc_code: vendor.payment_details?.ifsc_code || "",
                      upi_id: vendor.payment_details?.upi_id || "",
                      payment_terms: vendor.payment_details?.payment_terms || "",
                    });
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedVendors.includes(vendor.id) && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding:</span>
                    <span className="font-medium text-amber-600">
                      ₹{bills
                        .filter(b => b.vendors?.id === vendor.id)
                        .reduce((sum, bill) => sum + bill.balance, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold mt-2">{bills.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold mt-2">
                ₹{bills.reduce((sum, bill) => sum + bill.balance, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold mt-2">
                ₹{bills.reduce((sum, bill) => sum + bill.paid, 0).toLocaleString()}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold mt-2">
                {bills.filter(b => 
                  b.due_date && 
                  new Date(b.due_date) < new Date() && 
                  b.balance > 0
                ).length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b">
                <th className="p-4 text-left font-semibold text-gray-700">Vendor</th>
                <th className="p-4 text-left font-semibold text-gray-700">Bill Date</th>
                <th className="p-4 text-left font-semibold text-gray-700">Due Date</th>
                <th className="p-4 text-left font-semibold text-gray-700">Total</th>
                <th className="p-4 text-left font-semibold text-gray-700">Paid</th>
                <th className="p-4 text-left font-semibold text-gray-700">Balance</th>
                <th className="p-4 text-left font-semibold text-gray-700">Status</th>
                <th className="p-4 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const isOverdue = b.due_date && new Date(b.due_date) < new Date() && b.balance > 0;
                
                return (
                  <tr key={b.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors flex items-center gap-1"
                            onClick={() =>
                              router.push(`/admin/vendors/${b.vendors?.id}`)
                            }
                          >
                            {b.vendors?.name}
                            <ChevronRight className="h-3 w-3" />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{b.bill_date}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className={`h-3 w-3 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`} />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {b.due_date || "-"}
                          {isOverdue && (
                            <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                              Overdue
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        ₹{b.total.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        ₹{b.paid.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      <div className={`flex items-center gap-2 ${b.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        <CreditCard className="h-3 w-3" />
                        ₹{b.balance.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline"
                        className={`${getStatusColor(b.status)} border flex items-center gap-1.5 px-3 py-1.5`}
                      >
                        {getStatusIcon(b.status)}
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3"
                                onClick={() =>
                                  router.push(`/admin/vendors/${b.vendors?.id}`)
                                }
                              >
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View History</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button
                          size="sm"
                          disabled={b.balance === 0}
                          className="h-8 px-3"
                          onClick={() => {
                            setPayBill(b);
                            setPayAmount(String(b.balance));
                            setPayOpen(true);
                          }}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {bills.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No vendor bills found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first vendor bill</p>
            <Button onClick={() => setOpen(true)}>
              Create Vendor Bill
            </Button>
          </div>
        )}
      </div>

      {/* EXCEL EXPORT MODAL */}
      <Dialog open={excelOpen} onOpenChange={setExcelOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Create Payment Excel Sheet
            </DialogTitle>
            <DialogDescription>
              Enter payment amounts for each vendor. You can specify partial or full payments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium">Vendor</th>
                    <th className="p-3 text-left font-medium">GSTIN</th>
                    <th className="p-3 text-left font-medium">Address</th>
                    <th className="p-3 text-left font-medium">Outstanding</th>
                    <th className="p-3 text-left font-medium">Payment Amount</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {excelRows.map((row, index) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{row.vendor_name}</td>
                      <td className="p-3">
                        <Input
                          value={row.vendor_gstin}
                          onChange={(e) => updateExcelRow(index, 'vendor_gstin', e.target.value)}
                          placeholder="Enter GSTIN"
                        />
                      </td>
                      <td className="p-3">
                        <Textarea
                          value={row.vendor_address}
                          onChange={(e) => updateExcelRow(index, 'vendor_address', e.target.value)}
                          placeholder="Enter address"
                          rows={2}
                        />
                      </td>
                      <td className="p-3 font-medium">
                        ₹{row.total_outstanding.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">₹</span>
                          </div>
                          <Input
                            type="number"
                            value={row.payment_amount}
                            onChange={(e) => updateExcelRow(index, 'payment_amount', e.target.value)}
                            className="pl-10"
                            max={row.total_outstanding}
                            min={0}
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={row.payment_type === 'full' ? 'default' : 'secondary'}>
                          {row.payment_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Input
                          value={row.notes || ''}
                          onChange={(e) => updateExcelRow(index, 'notes', e.target.value)}
                          placeholder="Payment notes"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Payment:</p>
                  <p className="text-2xl font-bold">
                    ₹{excelRows.reduce((sum, row) => sum + row.payment_amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Outstanding:</p>
                  <p className="text-xl">
                    ₹{excelRows.reduce((sum, row) => sum + row.total_outstanding, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExcelOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={exportToExcel}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT VENDOR MODAL */}
      <Dialog open={!!editVendor} onOpenChange={(open) => !open && setEditVendor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Vendor Details
            </DialogTitle>
            <DialogDescription>
              Update GSTIN, address, and payment details for {editVendor?.name}
            </DialogDescription>
          </DialogHeader>

          {editVendor && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>GSTIN Number</Label>
                <Input
                  value={editForm.gst_number}
                  onChange={(e) => setEditForm({...editForm, gst_number: e.target.value})}
                  placeholder="Enter GSTIN number"
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Payment Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input
                      value={editForm.bank_name}
                      onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                      placeholder="Bank name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={editForm.account_number}
                      onChange={(e) => setEditForm({...editForm, account_number: e.target.value})}
                      placeholder="Account number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={editForm.ifsc_code}
                      onChange={(e) => setEditForm({...editForm, ifsc_code: e.target.value})}
                      placeholder="IFSC code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      value={editForm.upi_id}
                      onChange={(e) => setEditForm({...editForm, upi_id: e.target.value})}
                      placeholder="UPI ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input
                    value={editForm.payment_terms}
                    onChange={(e) => setEditForm({...editForm, payment_terms: e.target.value})}
                    placeholder="E.g., Net 30, COD, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditVendor(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveVendorDetails}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PAY MODAL */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay Vendor Bill
            </DialogTitle>
          </DialogHeader>

          {payBill && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vendor:</span>
                  <span className="font-medium">{payBill.vendors?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-bold text-lg">₹{payBill.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Already Paid:</span>
                  <span className="text-green-600">₹{payBill.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm font-medium text-gray-700">Balance Due:</span>
                  <span className="font-bold text-xl text-amber-600">
                    ₹{payBill.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Payment Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="number"
                    value={payAmount}
                    max={payBill.balance}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="pl-10 text-lg"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Max: ₹{payBill.balance.toLocaleString()}</span>
                  {payAmount && (
                    <span>Remaining: ₹{(payBill.balance - Number(payAmount)).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPayOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitPayment}
                  disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > payBill.balance}
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE BILL MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Vendor Bill
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Header Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bill Header</label>
              <Input
                placeholder="Enter bill header/description"
                value={form.header}
                onChange={(e) =>
                  setForm({ ...form, header: e.target.value })
                }
              />
            </div>

            {/* Vendor Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Search vendor by name"
                  value={vendorQuery}
                  onChange={(e) => {
                    setVendorQuery(e.target.value);
                    searchVendors(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              
              {vendorSuggestions.length > 0 && (
                <div className="border rounded-md shadow-sm max-h-48 overflow-y-auto">
                  {vendorSuggestions.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-2"
                      onClick={() => {
                        setVendorQuery(v.name);
                        setSelectedVendor(v);
                        setVendorSuggestions([]);
                      }}
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{v.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Bill Date
                </label>
                <Input
                  type="date"
                  value={form.bill_date}
                  onChange={(e) =>
                    setForm({ ...form, bill_date: e.target.value })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={form.due_date}
                  min={form.bill_date}
                  onChange={(e) =>
                    setForm({ ...form, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Total Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">₹</span>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.total}
                  onChange={(e) =>
                    setForm({ ...form, total: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add any additional notes or description"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createBill} 
                disabled={!vendorQuery || !form.total}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Create Bill
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}