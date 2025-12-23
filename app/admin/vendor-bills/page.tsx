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
  FileSpreadsheet,
  Banknote,
  Building2,
  MapPin,
  QrCode,
  Filter,
  RefreshCw,
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
  account_number?: string;
  ifsc_code?: string;
  upi_id?: string;
  outstanding_amount?: number;
  created_at: string;
  // Note: payment_details column doesn't exist in your schema
};

type VendorBill = {
  id: string;
  bill_date: string;
  due_date: string | null;
  total: number;
  status: "unpaid" | "partially_paid" | "paid";
  paid: number;
  balance: number;
  vendor_id?: string;
  vendors?: Vendor;
};

type ExcelRow = {
  id: string;
  vendor_name: string;
  vendor_phone: string;
  vendor_email: string;
  vendor_gstin: string;
  vendor_address: string;
  bank_name: string; // We'll keep this as a separate field for manual entry
  account_number: string;
  ifsc_code: string;
  upi_id: string;
  total_outstanding: number;
  payment_amount: number;
  payment_type: "full" | "partial";
  notes?: string;
};

export default function VendorBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  
  /* ---------- Filter States ---------- */
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  /* ---------- Vendor Management ---------- */
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState({
    gst_number: "",
    address: "",
    bank_name: "", // For manual entry in Excel
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    payment_terms: "", // We'll store this in a notes field
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
    
    try {
      console.log("Loading bills from vendor_bills table...");
      
      // Simple query without complex joins
      const { data: billsData, error: billsError } = await supabase
        .from("vendor_bills")
        .select(`
          id,
          vendor_id,
          bill_date,
          due_date,
          total,
          status,
          description,
          notes,
          created_at
        `)
        .order("bill_date", { ascending: false });

      if (billsError) {
        console.error("Error loading bills:", billsError);
        toast.error(`Failed to load bills: ${billsError.message}`);
        setBills([]);
        setLoading(false);
        return;
      }

      console.log(`Found ${billsData?.length || 0} bills`);

      if (!billsData || billsData.length === 0) {
        setBills([]);
        setLoading(false);
        return;
      }

      // Get vendor details for each bill
      const vendorIds = billsData.map(bill => bill.vendor_id).filter(Boolean);
      const vendorMap = new Map<string, Vendor>();
      
      if (vendorIds.length > 0) {
        // Query vendors table with correct columns from your schema
        const { data: vendorsData, error: vendorsError } = await supabase
          .from("vendors")
          .select(`
            id,
            name,
            phone,
            email,
            gst_number,
            address,
            account_number,
            ifsc_code,
            upi_id,
            outstanding_amount,
            created_at
          `)
          .in("id", vendorIds);
        
        if (vendorsError) {
          console.error("Error loading vendors:", vendorsError);
        } else if (vendorsData) {
          vendorsData.forEach(vendor => {
            vendorMap.set(vendor.id, vendor);
          });
          console.log(`Loaded ${vendorsData.length} vendors`);
        }
      }

      // Load payments for each bill
      const billIds = billsData.map(bill => bill.id);
      const paymentMap = new Map<string, number>();
      
      if (billIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("vendor_bill_payments")
          .select("vendor_bill_id, amount")
          .in("vendor_bill_id", billIds);
        
        if (paymentsError) {
          console.error("Error loading payments:", paymentsError);
        } else if (paymentsData) {
          paymentsData.forEach(payment => {
            const current = paymentMap.get(payment.vendor_bill_id) || 0;
            paymentMap.set(payment.vendor_bill_id, current + Number(payment.amount || 0));
          });
        }
      }

      // Process bills with vendor and payment data
      const enrichedBills: VendorBill[] = billsData.map(bill => {
        const paid = paymentMap.get(bill.id) || 0;
        const balance = Number(bill.total || 0) - paid;
        const vendor = vendorMap.get(bill.vendor_id || "");
        
        // Determine status based on payments
        let status: "unpaid" | "partially_paid" | "paid" = "unpaid";
        
        if (bill.status === "paid" || paid >= Number(bill.total || 0)) {
          status = "paid";
        } else if (bill.status === "partially_paid" || (paid > 0 && paid < Number(bill.total || 0))) {
          status = "partially_paid";
        }

        return {
          id: bill.id,
          bill_date: bill.bill_date || new Date().toISOString().split('T')[0],
          due_date: bill.due_date,
          total: Number(bill.total || 0),
          status,
          paid,
          balance,
          vendor_id: bill.vendor_id,
          vendors: vendor || undefined,
        };
      });

      console.log(`Successfully processed ${enrichedBills.length} bills`);
      setBills(enrichedBills);
      
    } catch (error: any) {
      console.error("Unexpected error in loadBills:", error);
      toast.error("Failed to load vendor bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadVendors() {
    try {
      console.log("Loading vendors from database...");
      
      // Query with correct columns from your schema
      const { data, error } = await supabase
        .from("vendors")
        .select(`
          id,
          name,
          phone,
          email,
          gst_number,
          address,
          account_number,
          ifsc_code,
          upi_id,
          outstanding_amount,
          created_at
        `)
        .order("name");

      if (error) {
        console.error("Error loading vendors:", error);
        toast.error(`Failed to load vendors: ${error.message}`);
        return;
      }

      console.log(`Loaded ${data?.length || 0} vendors`);
      
      if (data) {
        setVendors(data);
      }
    } catch (error: any) {
      console.error("Unexpected error in loadVendors:", error);
      toast.error("Failed to load vendors");
    }
  }

  /* ================= FILTERED BILLS ================= */
  
  const filteredBills = bills.filter(bill => {
    // Filter by status
    if (statusFilter !== "all" && bill.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const vendorName = bill.vendors?.name?.toLowerCase() || "";
      const vendorGST = bill.vendors?.gst_number?.toLowerCase() || "";
      const billId = bill.id.toLowerCase();
      
      return vendorName.includes(term) || 
             vendorGST.includes(term) || 
             billId.includes(term);
    }
    
    return true;
  });

  /* ================= STATS CALCULATION ================= */
  
  const stats = {
    totalBills: bills.length,
    pendingAmount: bills.reduce((sum, bill) => sum + bill.balance, 0),
    totalPaid: bills.reduce((sum, bill) => sum + bill.paid, 0),
    overdueBills: bills.filter(b => 
      b.due_date && 
      new Date(b.due_date) < new Date() && 
      b.balance > 0
    ).length,
    unpaidBills: bills.filter(b => b.status === 'unpaid').length,
    partiallyPaidBills: bills.filter(b => b.status === 'partially_paid').length,
    paidBills: bills.filter(b => b.status === 'paid').length,
    vendorsWithUPI: vendors.filter(v => v.upi_id).length,
    vendorsWithBank: vendors.filter(v => v.account_number).length,
  };

  /* ================= VENDOR MANAGEMENT ================= */

  async function saveVendorDetails() {
    if (!editVendor) return;

    try {
      // Update vendor with correct columns from your schema
      const { error } = await supabase
        .from("vendors")
        .update({
          gst_number: editForm.gst_number || null,
          address: editForm.address || null,
          account_number: editForm.account_number || null,
          ifsc_code: editForm.ifsc_code || null,
          upi_id: editForm.upi_id || null,
        })
        .eq("id", editVendor.id);

      if (error) {
        console.error("Error saving vendor details:", error);
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
      
      // Refresh data
      await Promise.all([loadVendors(), loadBills()]);
      
    } catch (error) {
      console.error("Error in saveVendorDetails:", error);
      toast.error("Failed to save vendor details");
    }
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

      // Create Excel row with vendor details
      const vendorDetails: ExcelRow = {
        id: vendor.id,
        vendor_name: vendor.name,
        vendor_phone: vendor.phone || "",
        vendor_email: vendor.email || "",
        vendor_gstin: vendor.gst_number || "",
        vendor_address: vendor.address || "",
        bank_name: "", // Will be manually filled in Excel
        account_number: vendor.account_number || "",
        ifsc_code: vendor.ifsc_code || "",
        upi_id: vendor.upi_id || "",
        total_outstanding: totalOutstanding,
        payment_amount: 0,
        payment_type: "partial",
        notes: "",
      };

      return vendorDetails;
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
    try {
      // Calculate total payment
      const totalPayment = excelRows.reduce((sum, row) => sum + row.payment_amount, 0);
      
      if (totalPayment === 0) {
        toast.error("Please enter payment amounts");
        return;
      }

      // Create Excel data with all vendor details
      const excelData = excelRows.map(row => ({
        "Vendor ID": row.id,
        "Vendor Name": row.vendor_name,
        "Phone": row.vendor_phone,
        "Email": row.vendor_email,
        "GSTIN": row.vendor_gstin,
        "Address": row.vendor_address,
        "Bank Name": row.bank_name,
        "Account Number": row.account_number,
        "IFSC Code": row.ifsc_code,
        "UPI ID": row.upi_id,
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
      
      // Auto-size columns
      const maxWidth = excelData.reduce((w, r) => Math.max(w, r["Vendor Name"].length), 10);
      worksheet['!cols'] = [
        { wch: 10 }, // Vendor ID
        { wch: maxWidth }, // Vendor Name
        { wch: 15 }, // Phone
        { wch: 25 }, // Email
        { wch: 20 }, // GSTIN
        { wch: 40 }, // Address
        { wch: 20 }, // Bank Name
        { wch: 20 }, // Account Number
        { wch: 15 }, // IFSC Code
        { wch: 20 }, // UPI ID
        { wch: 15 }, // Total Outstanding
        { wch: 15 }, // Payment Amount
        { wch: 12 }, // Payment Type
        { wch: 30 }, // Notes
      ];

      // Add summary sheet
      const summary = [
        ["VENDOR PAYMENT SUMMARY"],
        ["Generated Date:", new Date().toLocaleDateString()],
        ["Generated Time:", new Date().toLocaleTimeString()],
        [""],
        ["SUMMARY"],
        ["Total Vendors:", excelRows.length],
        ["Total Outstanding:", excelRows.reduce((s, r) => s + r.total_outstanding, 0)],
        ["Total Payment:", totalPayment],
        ["Payment Coverage:", `${((totalPayment / excelRows.reduce((s, r) => s + r.total_outstanding, 0)) * 100).toFixed(2)}%`],
        [""],
        ["PAYMENT BREAKDOWN"],
        ["Full Payments:", excelRows.filter(r => r.payment_type === 'full').length],
        ["Partial Payments:", excelRows.filter(r => r.payment_type === 'partial').length],
        [""],
        ["NOTES"],
        ["1. Verify GSTIN and bank details before processing payments"],
        ["2. Ensure UPI IDs are correct for instant transfers"],
        ["3. Cross-check IFSC codes for bank transfers"],
        ["4. Update payment status in the system after completion"],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Generate and download
      const fileName = `vendor-payments-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Excel file "${fileName}" downloaded successfully`);
      setExcelOpen(false);
      
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export Excel file");
    }
  }

  /* ================= VENDOR SEARCH ================= */

  async function searchVendors(q: string) {
    if (!q.trim()) {
      setVendorSuggestions([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("vendors")
        .select("id, name, gst_number, address, account_number, ifsc_code, upi_id")
        .ilike("name", `%${q}%`)
        .limit(5);

      setVendorSuggestions(data || []);
    } catch (error) {
      console.error("Error searching vendors:", error);
      setVendorSuggestions([]);
    }
  }

  /* ================= CREATE BILL ================= */

  async function createBill() {
    if (!vendorQuery.trim() || !form.total.trim()) {
      toast.error("Please select a vendor and enter total amount");
      return;
    }

    try {
      // Find vendor ID from name
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id")
        .ilike("name", vendorQuery.trim())
        .single();

      if (!vendorData) {
        toast.error("Vendor not found");
        return;
      }

      const { error } = await supabase
        .from("vendor_bills")
        .insert({
          vendor_id: vendorData.id,
          bill_date: form.bill_date,
          due_date: form.due_date || null,
          total: Number(form.total),
          description: form.header,
          notes: form.notes,
          status: "unpaid",
        });

      if (error) {
        console.error("Error creating bill:", error);
        toast.error("Failed to create bill");
        return;
      }

      toast.success("Vendor bill created successfully");
      
      // Reset form
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
      
      // Reload bills
      await loadBills();
      
    } catch (error) {
      console.error("Error in createBill:", error);
      toast.error("Failed to create bill");
    }
  }

  /* ================= PAY BILL ================= */

  async function submitPayment() {
    if (!payBill || !payAmount) return;

    const amount = Number(payAmount);
    if (amount <= 0 || amount > payBill.balance) {
      toast.error("Invalid payment amount");
      return;
    }

    try {
      const { error } = await supabase
        .from("vendor_bill_payments")
        .insert({
          vendor_bill_id: payBill.id,
          amount: amount,
          payment_method: "bank",
          paid_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error submitting payment:", error);
        toast.error("Failed to submit payment");
        return;
      }

      // Update bill status if fully paid
      if (amount >= payBill.balance) {
        await supabase
          .from("vendor_bills")
          .update({ status: "paid" })
          .eq("id", payBill.id);
      } else if (amount > 0) {
        await supabase
          .from("vendor_bills")
          .update({ status: "partially_paid" })
          .eq("id", payBill.id);
      }

      toast.success("Payment submitted successfully");
      
      // Reset and reload
      setPayOpen(false);
      setPayBill(null);
      setPayAmount("");
      await loadBills();
      
    } catch (error) {
      console.error("Error in submitPayment:", error);
      toast.error("Failed to submit payment");
    }
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor bills...</p>
          <Button 
            variant="outline" 
            onClick={loadBills}
            className="mt-4"
          >
            Retry Loading
          </Button>
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
            Manage vendor bills and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadBills}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={prepareExcelData}
            disabled={selectedVendors.length === 0}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export ({selectedVendors.length})
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by vendor name or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bills ({bills.length})</SelectItem>
              <SelectItem value="unpaid">Unpaid ({stats.unpaidBills})</SelectItem>
              <SelectItem value="partially_paid">Partially Paid ({stats.partiallyPaidBills})</SelectItem>
              <SelectItem value="paid">Paid ({stats.paidBills})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold mt-2">{stats.totalBills}</p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredBills.length} showing
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-bold mt-2">
                ₹{stats.pendingAmount.toLocaleString()}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {stats.overdueBills} overdue
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
                ₹{stats.totalPaid.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats.paidBills} paid bills
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">UPI Vendors</p>
              <p className="text-2xl font-bold mt-2">
                {stats.vendorsWithUPI}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Quick payment ready
              </p>
            </div>
            <QrCode className="h-8 w-8 text-purple-500" />
          </div>
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
          {vendors.map((vendor) => {
            const hasPaymentDetails = vendor.account_number || vendor.ifsc_code || vendor.upi_id;
            const vendorBills = bills.filter(b => b.vendors?.id === vendor.id);
            const totalOutstanding = vendorBills.reduce((sum, bill) => sum + bill.balance, 0);
            const unpaidBills = vendorBills.filter(b => b.balance > 0).length;
            
            return (
              <div
                key={vendor.id}
                className={`border rounded-lg p-4 transition-all ${
                  selectedVendors.includes(vendor.id)
                    ? "border-primary bg-blue-50"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
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
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{vendor.name}</h3>
                        {hasPaymentDetails && (
                          <Badge variant="outline" className="text-xs">
                            Bank Info
                          </Badge>
                        )}
                      </div>
                      
                      {vendor.gst_number && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span>GST: {vendor.gst_number}</span>
                        </div>
                      )}
                      
                      {vendor.address && (
                        <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{vendor.address}</span>
                        </div>
                      )}
                      
                      {/* Payment Details Summary */}
                      {(vendor.account_number || vendor.upi_id) && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {vendor.account_number && (
                              <div className="flex items-center gap-1 text-xs">
                                <Banknote className="h-3 w-3" />
                                <span>Acct: ••••{vendor.account_number.slice(-4)}</span>
                              </div>
                            )}
                            {vendor.upi_id && (
                              <div className="flex items-center gap-1 text-xs">
                                <QrCode className="h-3 w-3" />
                                <span>UPI: {vendor.upi_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
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
                        bank_name: "", // Not stored in DB
                        account_number: vendor.account_number || "",
                        ifsc_code: vendor.ifsc_code || "",
                        upi_id: vendor.upi_id || "",
                        payment_terms: "", // Not stored in DB
                      });
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Bill Summary */}
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-muted-foreground">Bills:</span>
                      <span>{unpaidBills} pending</span>
                    </div>
                    <span className="font-medium text-amber-600">
                      ₹{totalOutstanding.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BILLS TABLE */}
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
              {filteredBills.length > 0 ? (
                filteredBills.map((b) => {
                  const isOverdue = b.due_date && new Date(b.due_date) < new Date() && b.balance > 0;
                  const hasUPI = b.vendors?.upi_id;
                  
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
                              {b.vendors?.name || "Unknown Vendor"}
                              <ChevronRight className="h-3 w-3" />
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {b.vendors?.gst_number && (
                                <Badge variant="outline" className="text-xs">
                                  GST: {b.vendors.gst_number}
                                </Badge>
                              )}
                              {hasUPI && (
                                <Badge variant="secondary" className="text-xs">
                                  UPI: {b.vendors?.upi_id}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(b.bill_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CalendarDays className={`h-3 w-3 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {b.due_date ? new Date(b.due_date).toLocaleDateString() : "-"}
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
                                  disabled={!b.vendors?.id}
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
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {bills.length === 0 ? 'No vendor bills found' : 'No bills match your filters'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {bills.length === 0 
                        ? 'Get started by creating your first vendor bill' 
                        : 'Try changing your search or filter criteria'}
                    </p>
                    {bills.length === 0 && (
                      <Button onClick={() => setOpen(true)}>
                        Create Vendor Bill
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXCEL EXPORT MODAL */}
      <Dialog open={excelOpen} onOpenChange={setExcelOpen}>
        <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Create Vendor Payment Sheet
            </DialogTitle>
            <DialogDescription>
              Complete payment sheet with vendor details for batch processing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium border">Vendor</th>
                    <th className="p-3 text-left font-medium border">GSTIN</th>
                    <th className="p-3 text-left font-medium border">Address</th>
                    <th className="p-3 text-left font-medium border">Bank Name</th>
                    <th className="p-3 text-left font-medium border">Account No.</th>
                    <th className="p-3 text-left font-medium border">IFSC</th>
                    <th className="p-3 text-left font-medium border">UPI ID</th>
                    <th className="p-3 text-left font-medium border">Outstanding</th>
                    <th className="p-3 text-left font-medium border">Payment</th>
                    <th className="p-3 text-left font-medium border">Type</th>
                    <th className="p-3 text-left font-medium border">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {excelRows.map((row, index) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium border">{row.vendor_name}</td>
                      <td className="p-3 border">
                        <Input
                          value={row.vendor_gstin}
                          onChange={(e) => updateExcelRow(index, 'vendor_gstin', e.target.value)}
                          placeholder="Enter GSTIN"
                          className="text-xs"
                        />
                      </td>
                      <td className="p-3 border">
                        <Textarea
                          value={row.vendor_address}
                          onChange={(e) => updateExcelRow(index, 'vendor_address', e.target.value)}
                          placeholder="Enter address"
                          rows={2}
                          className="text-xs"
                        />
                      </td>
                      <td className="p-3 border">
                        <Input
                          value={row.bank_name}
                          onChange={(e) => updateExcelRow(index, 'bank_name', e.target.value)}
                          placeholder="Bank name (enter manually)"
                          className="text-xs"
                        />
                      </td>
                      <td className="p-3 border">
                        <Input
                          value={row.account_number}
                          onChange={(e) => updateExcelRow(index, 'account_number', e.target.value)}
                          placeholder="Account number"
                          className="text-xs"
                        />
                      </td>
                      <td className="p-3 border">
                        <Input
                          value={row.ifsc_code}
                          onChange={(e) => updateExcelRow(index, 'ifsc_code', e.target.value.toUpperCase())}
                          placeholder="IFSC code"
                          className="text-xs uppercase"
                        />
                      </td>
                      <td className="p-3 border">
                        <Input
                          value={row.upi_id}
                          onChange={(e) => updateExcelRow(index, 'upi_id', e.target.value)}
                          placeholder="UPI ID"
                          className="text-xs"
                        />
                      </td>
                      <td className="p-3 font-medium border">
                        ₹{row.total_outstanding.toLocaleString()}
                      </td>
                      <td className="p-3 border">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs">₹</span>
                          </div>
                          <Input
                            type="number"
                            value={row.payment_amount}
                            onChange={(e) => updateExcelRow(index, 'payment_amount', e.target.value)}
                            className="pl-10 text-xs"
                            max={row.total_outstanding}
                            min={0}
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="p-3 border">
                        <Badge 
                          variant={row.payment_type === 'full' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {row.payment_type}
                        </Badge>
                      </td>
                      <td className="p-3 border">
                        <Input
                          value={row.notes || ''}
                          onChange={(e) => updateExcelRow(index, 'notes', e.target.value)}
                          placeholder="Payment notes"
                          className="text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Vendors</p>
                  <p className="text-2xl font-bold">{excelRows.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">
                    ₹{excelRows.reduce((sum, row) => sum + row.total_outstanding, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Payment</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{excelRows.reduce((sum, row) => sum + row.payment_amount, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Coverage</p>
                  <p className="text-2xl font-bold">
                    {excelRows.reduce((sum, row) => sum + row.total_outstanding, 0) > 0
                      ? `${((excelRows.reduce((sum, row) => sum + row.payment_amount, 0) / 
                          excelRows.reduce((sum, row) => sum + row.total_outstanding, 0)) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vendors with UPI:</p>
                  <p>{excelRows.filter(r => r.upi_id).length} vendors</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendors with Bank Details:</p>
                  <p>{excelRows.filter(r => r.account_number).length} vendors</p>
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
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Download Excel Sheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT VENDOR MODAL - Updated for your schema */}
      <Dialog open={!!editVendor} onOpenChange={(open) => !open && setEditVendor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Vendor Details
            </DialogTitle>
            <DialogDescription>
              Update vendor information for {editVendor?.name}
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
                <h4 className="font-medium">Payment Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      Account Number
                    </Label>
                    <Input
                      value={editForm.account_number}
                      onChange={(e) => setEditForm({...editForm, account_number: e.target.value})}
                      placeholder="Bank account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input
                      value={editForm.ifsc_code}
                      onChange={(e) => setEditForm({...editForm, ifsc_code: e.target.value.toUpperCase()})}
                      placeholder="IFSC code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    UPI ID
                  </Label>
                  <Input
                    value={editForm.upi_id}
                    onChange={(e) => setEditForm({...editForm, upi_id: e.target.value})}
                    placeholder="UPI ID (e.g., vendor@upi)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bank Name (for Excel)</Label>
                  <Input
                    value={editForm.bank_name}
                    onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                    placeholder="Enter bank name for Excel export"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in Excel exports but not stored in database
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms (for Excel)</Label>
                  <Input
                    value={editForm.payment_terms}
                    onChange={(e) => setEditForm({...editForm, payment_terms: e.target.value})}
                    placeholder="E.g., Net 30, COD, etc."
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in Excel exports but not stored in database
                  </p>
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
                  <span className="font-medium">{payBill.vendors?.name || "Unknown Vendor"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">GSTIN:</span>
                  <span className="text-sm">{payBill.vendors?.gst_number || "N/A"}</span>
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
                      <div>
                        <span className="font-medium">{v.name}</span>
                        {v.gst_number && (
                          <p className="text-xs text-gray-500">GSTIN: {v.gst_number}</p>
                        )}
                        {v.upi_id && (
                          <p className="text-xs text-green-500">UPI: {v.upi_id}</p>
                        )}
                      </div>
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