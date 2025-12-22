"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Upload, 
  Save, 
  Eye, 
  Calendar,
  Search,
  FileText,
  ExternalLink,
  RefreshCw,
  Printer,
  IndianRupee,
  Building,
  Phone,
  Mail,
  MapPin,
  History,
  ChevronDown,
  X,
  Filter,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface VendorBill {
  id: string;
  description: string;
  amount: number;
  gst: number;
  total: number;
  file_url: string;
  bill_date: string;
  created_at: string;
  status: string;
  vendor_id?: string;
  vendor?: {
    name: string;
    gst_number?: string;
    address?: string;
    phone?: string;
  };
}

interface Vendor {
  id: string;
  name: string;
  gst_number?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function VendorBillsPage() {
  const [vendorName, setVendorName] = useState("");
  const [vendorGST, setVendorGST] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [gst, setGst] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<VendorBill[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [billNumber, setBillNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [allBills, setAllBills] = useState<VendorBill[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const vendorInputRef = useRef<HTMLInputElement>(null);

  const COMPANY_INFO = {
    name: "Mountain Pass Residency",
    address: "Anamari, Vazhikkadavu, Kerala 679333",
    phone: "+91 98765 43210",
    email: "accounts@mountainpassresort.com",
    website: "www.mountainpassresort.com",
    gstin: "29ABCDE1234F1Z5",
    
  };

  useEffect(() => {
    const d = new Date();
    const formattedDate = d.toISOString().split("T")[0];
    setInvoiceDate(formattedDate);
    
    // Generate bill number (format: MP/VB/YYYYMMDD/001)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setBillNumber(`MP/VB/${year}${month}${day}/${random}`);
    
    fetchVendors();
    fetchAllBills();
  }, []);

  useEffect(() => {
    // Filter vendors based on search input
    if (vendorName.trim() === "") {
      setFilteredVendors([]);
    } else {
      const filtered = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(vendorName.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [vendorName, vendors]);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, gst_number, address, phone, email")
      .order("name");
    
    if (!error && data) {
      setVendors(data);
    }
  };

  const fetchAllBills = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendor_bills")
        .select(`
          *,
          vendor:vendor_id (name, gst_number, address, phone)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAllBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const total = (Number(amount) || 0) + (Number(gst) || 0);

  // Safe date handling function
  const getDueDate = () => {
    if (!invoiceDate) return "";
    
    try {
      const date = new Date(invoiceDate);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      date.setDate(date.getDate() + 15);
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Date calculation error:", error);
      return "";
    }
  };

  const selectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorName(vendor.name);
    setVendorGST(vendor.gst_number || "");
    setVendorAddress(vendor.address || "");
    setShowVendorSuggestions(false);
    if (vendorInputRef.current) {
      vendorInputRef.current.focus();
    }
  };

  const clearVendorSelection = () => {
    setSelectedVendor(null);
    setVendorName("");
    setVendorGST("");
    setVendorAddress("");
  };

  const generatePDF = async () => {
    if (!vendorName || !amount) {
      alert("Please enter vendor name and amount first");
      return;
    }

    setPdfLoading(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header with Logo
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company Details at top center
      doc.setFontSize(24);
      doc.setTextColor(50, 100, 150);
      doc.text("MOUNTAIN PASS", pageWidth / 2, 15, { align: "center" });
      doc.setFontSize(14);
      doc.text("RESORT & SPA", pageWidth / 2, 22, { align: "center" });
      
      // Company Details
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(COMPANY_INFO.address, pageWidth / 2, 30, { align: "center" });
      doc.text(`📞 ${COMPANY_INFO.phone} | 📧 ${COMPANY_INFO.email}`, pageWidth / 2, 35, { align: "center" });
      
      // Bill Header
      doc.setFillColor(50, 100, 150);
      doc.rect(margin, 45, contentWidth, 12, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("TAX INVOICE", pageWidth / 2, 53, { align: "center" });
      
      let yPos = 65;
      
      // Bill Details Section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Left side - Bill From
      doc.setFont(undefined, 'bold');
      doc.text("Bill From:", margin, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(COMPANY_INFO.name, margin + 25, yPos);
      doc.text(COMPANY_INFO.address, margin + 25, yPos + 5);
      doc.text(`GSTIN: ${COMPANY_INFO.gstin}`, margin + 25, yPos + 10);
      doc.text(`PAN: ${COMPANY_INFO.pan}`, margin + 25, yPos + 15);
      
      // Right side - Bill Details
      doc.setFont(undefined, 'bold');
      doc.text("Bill To:", pageWidth - margin - 80, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(vendorName, pageWidth - margin - 55, yPos);
      if (vendorGST) {
        doc.text(`GST: ${vendorGST}`, pageWidth - margin - 55, yPos + 5);
      }
      if (vendorAddress) {
        const addressLines = doc.splitTextToSize(vendorAddress, 50);
        doc.text(addressLines, pageWidth - margin - 55, yPos + (vendorGST ? 10 : 5));
        yPos += (addressLines.length - 1) * 4;
      }
      
      yPos = 90;
      
      // Invoice Details Table
      const tableTop = yPos;
      
      // Table Header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, tableTop, contentWidth, 8, 'F');
      doc.setFont(undefined, 'bold');
      doc.text("Invoice Details", margin + 5, tableTop + 6);
      
      yPos = tableTop + 15;
      
      // Invoice Info
      const dueDate = getDueDate();
      const invoiceData = [
        ["Invoice No:", billNumber, "Invoice Date:", invoiceDate || "-"],
        ["Due Date:", dueDate || "-", "Reference:", (description?.substring(0, 30) + "...") || "-"]
      ];
      
      invoiceData.forEach((row, i) => {
        doc.text(row[0], margin + 5, yPos + (i * 7));
        doc.text(row[1], margin + 35, yPos + (i * 7));
        doc.text(row[2], pageWidth / 2 + 5, yPos + (i * 7));
        doc.text(row[3], pageWidth / 2 + 35, yPos + (i * 7));
      });
      
      yPos += 25;
      
      // Items Table Header
      doc.setFillColor(50, 100, 150);
      doc.rect(margin, yPos, contentWidth, 8, 'F');
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("Description", margin + 5, yPos + 6);
      doc.text("Amount (₹)", pageWidth - margin - 25, yPos + 6, { align: "right" });
      
      yPos += 15;
      
      // Items Content
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      const items = description ? description.split('\n').filter(item => item.trim()) : ["Goods/Services"];
      
      items.forEach((item, index) => {
        doc.text(item.substring(0, 60), margin + 5, yPos);
        if (index === 0) {
          doc.text(`₹${Number(amount || 0).toLocaleString("en-IN")}`, pageWidth - margin - 5, yPos, { align: "right" });
        }
        yPos += 6;
      });
      
      yPos += 10;
      
      // Amount Calculation
      const calculations = [
        ["Subtotal:", `₹${Number(amount || 0).toLocaleString("en-IN")}`],
        ["GST:", `₹${Number(gst || 0).toLocaleString("en-IN")}`],
      ];
      
      calculations.forEach(([label, value], i) => {
        doc.text(label, pageWidth - margin - 50, yPos + (i * 7));
        doc.text(value, pageWidth - margin - 5, yPos + (i * 7), { align: "right" });
      });
      
      yPos += 25;
      
      // Total Amount
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.text("TOTAL AMOUNT", pageWidth - margin - 50, yPos);
      doc.text(`₹${total.toLocaleString("en-IN")}`, pageWidth - margin - 5, yPos, { align: "right" });
      
      yPos += 15;
      
      // Terms & Conditions
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      const terms = [
        "Terms & Conditions:",
        "1. Payment due within 15 days from invoice date.",
        "2. Late payments may attract interest charges.",
        "3. Goods once sold will not be taken back.",
        "4. All disputes subject to Munnar jurisdiction.",
      ];
      
      terms.forEach((term, i) => {
        doc.text(term, margin + 5, yPos + (i * 4));
      });
      
      // Bank Details
      yPos += 25;
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text("Bank Details:", margin + 5, yPos);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Bank: ${COMPANY_INFO.bankName}`, margin + 5, yPos + 5);
      doc.text(`A/C No: ${COMPANY_INFO.accountNo}`, margin + 5, yPos + 10);
      doc.text(`IFSC: ${COMPANY_INFO.ifsc}`, margin + 5, yPos + 15);
      
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("This is a computer-generated invoice. No signature required.", pageWidth / 2, 280, { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, pageWidth / 2, 283, { align: "center" });
      
      // Download
      doc.save(`${billNumber.replace(/\//g, '_')}_${vendorName || 'Vendor'}.pdf`);
      
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const uploadToDrive = async () => {
    if (!file) return alert("Please select a file first");
    if (!vendorName) return alert("Please enter the vendor name");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorName", vendorName);
    formData.append("billDate", new Date().toISOString().split("T")[0]);

    try {
      const res = await fetch("/api/upload/vendor-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (data.url) {
        setDriveUrl(data.url);
        alert("Uploaded to Google Drive successfully");
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (!vendorName || !amount || !driveUrl) {
      return alert("Please fill all details & upload bill first");
    }

    try {
      let vendorId;
      
      // If vendor is selected from suggestions, use that ID
      if (selectedVendor) {
        vendorId = selectedVendor.id;
      } else {
        // Check if vendor exists, create if not
        const { data: existingVendor } = await supabase
          .from("vendors")
          .select("id")
          .eq("name", vendorName)
          .single();

        if (existingVendor) {
          vendorId = existingVendor.id;
          
          // Update vendor details if provided
          if (vendorGST || vendorAddress) {
            await supabase
              .from("vendors")
              .update({
                gst_number: vendorGST || existingVendor.gst_number,
                address: vendorAddress || existingVendor.address,
                updated_at: new Date().toISOString(),
              })
              .eq("id", vendorId);
          }
        } else {
          const { data: newVendor, error: vendorError } = await supabase
            .from("vendors")
            .insert({
              name: vendorName,
              gst_number: vendorGST || null,
              address: vendorAddress || null,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (vendorError) throw vendorError;
          vendorId = newVendor.id;
        }
      }

      // Save to vendor_bills table
      const { error: billError } = await supabase.from("vendor_bills").insert({
        vendor_id: vendorId,
        description: description,
        amount: parseFloat(amount),
        gst: parseFloat(gst) || 0,
        total: total,
        file_url: driveUrl,
        bill_date: invoiceDate,
        created_by: null,
        status: "unpaid",
        created_at: new Date().toISOString(),
      });

      if (billError) throw billError;

      alert("Vendor bill saved to database successfully!");
      
      // Reset form
      setSelectedVendor(null);
      setVendorName("");
      setVendorGST("");
      setVendorAddress("");
      setDescription("");
      setAmount("");
      setGst("");
      setFile(null);
      setDriveUrl("");
      
      // Refresh bills history
      fetchAllBills();
      
    } catch (error: any) {
      console.error("Save error:", error);
      alert(`Failed to save bill: ${error.message}`);
    }
  };

  const searchByDate = async () => {
    if (!searchDate) return alert("Please select a date to search");

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendor_bills")
        .select(`
          *,
          vendor:vendor_id (name, gst_number, address, phone)
        `)
        .eq("bill_date", searchDate)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
      alert(`Search failed: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const updateBillStatus = async (billId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("vendor_bills")
        .update({ 
          status: newStatus,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null 
        })
        .eq("id", billId);

      if (error) throw error;

      // Refresh lists
      fetchAllBills();
      if (searchDate) {
        searchByDate();
      }
      
      alert("Status updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const filteredBills = allBills.filter(bill => {
    if (statusFilter === "all") return true;
    return bill.status === statusFilter;
  });

  const totalUnpaid = allBills.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + b.total, 0);
  const totalPaid = allBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.total, 0);
  const totalPartiallyPaid = allBills.filter(b => b.status === 'partially_paid').reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 lg:p-6 space-y-8">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="Mountain Pass Resort Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Vendor Bills Management</h1>
              <p className="text-slate-600 mt-2">
                Professional invoice generation and management system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-300">
                  <History className="w-4 h-4 mr-2" />
                  View History ({allBills.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Vendor Bills History
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-red-50 to-white">
                      <CardContent className="p-4">
                        <div className="text-sm text-red-600 mb-1">Unpaid</div>
                        <div className="text-2xl font-bold text-red-800">₹{totalUnpaid.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-red-500">{allBills.filter(b => b.status === 'unpaid').length} bills</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-white">
                      <CardContent className="p-4">
                        <div className="text-sm text-yellow-600 mb-1">Partially Paid</div>
                        <div className="text-2xl font-bold text-yellow-800">₹{totalPartiallyPaid.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-yellow-500">{allBills.filter(b => b.status === 'partially_paid').length} bills</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="p-4">
                        <div className="text-sm text-green-600 mb-1">Paid</div>
                        <div className="text-2xl font-bold text-green-800">₹{totalPaid.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-green-500">{allBills.filter(b => b.status === 'paid').length} bills</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filter */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <Label>Filter by Status</Label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 mt-1"
                      >
                        <option value="all">All Bills</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <Button onClick={fetchAllBills} disabled={historyLoading} variant="outline" className="mt-6">
                      <RefreshCw className={`w-4 h-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {/* Bills Table */}
                  {/* Bills Table in History Modal */}
{historyLoading ? (
  <div className="text-center py-12">
    <div className="animate-spin h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
    <p className="text-slate-600 mt-3">Loading bills history...</p>
  </div>
) : filteredBills.length === 0 ? (
  <div className="text-center py-12 text-slate-600">
    No bills found
  </div>
) : (
  <div className="border border-slate-200 rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Date</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Vendor</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Description</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Amount</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Status</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Saved Bill</th>
          <th className="p-3 text-left text-sm font-semibold text-slate-700">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredBills.map((bill) => (
          <tr key={bill.id} className="hover:bg-slate-50">
            <td className="p-3">
              <div className="text-sm font-medium text-slate-900">
                {new Date(bill.bill_date).toLocaleDateString("en-IN")}
              </div>
            </td>
            <td className="p-3">
              <div className="font-medium text-slate-900">
                {bill.vendor?.name || "Unknown"}
              </div>
            </td>
            <td className="p-3">
              <div className="text-sm text-slate-700 max-w-xs truncate">
                {bill.description || "No description"}
              </div>
            </td>
            <td className="p-3">
              <div className="font-bold text-slate-900">
                ₹{bill.total.toLocaleString("en-IN")}
              </div>
            </td>
            <td className="p-3">
              <Badge className={
                bill.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : bill.status === 'partially_paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }>
                {bill.status}
              </Badge>
            </td>
            <td className="p-3">
              {bill.file_url ? (
                <a
                  href={bill.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  title={bill.file_url}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">View Bill</span>
                </a>
              ) : (
                <span className="text-slate-400 text-sm">No file</span>
              )}
            </td>
            <td className="p-3">
              <div className="flex items-center gap-2">
                <a
                  href={bill.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  title="View saved bill"
                >
                  <Eye className="w-4 h-4" />
                </a>
                <select
                  value={bill.status}
                  onChange={(e) => updateBillStatus(bill.id, e.target.value)}
                  className="text-xs border border-slate-300 rounded px-2 py-1"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
                </div>
              </DialogContent>
            </Dialog>
            <a href="/api/google/login">
              <Button variant="outline" className="border-slate-300">
                <ExternalLink className="w-4 h-4 mr-2" />
                Google Drive Login
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Create Bill Form */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <FileText className="w-6 h-6" />
                Create Professional Vendor Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Invoice Number
                  </Label>
                  <Input
                    value={billNumber}
                    readOnly
                    className="bg-slate-50 border-slate-300 font-mono"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Invoice Date *
                  </Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="border-slate-300"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={getDueDate()}
                    readOnly
                    className="bg-slate-50 border-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Vendor Selection with Autocomplete */}
                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Vendor Name *
                  </Label>
                  <div className="relative">
                    {selectedVendor && (
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building className="w-3 h-3 text-blue-600" />
                        </div>
                      </div>
                    )}
                    <Input
                      ref={vendorInputRef}
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      onFocus={() => setShowVendorSuggestions(true)}
                      placeholder="Type vendor name or select from list"
                      className={`${selectedVendor ? 'pl-10' : ''} border-slate-300`}
                      required
                    />
                    {selectedVendor && (
                      <button
                        onClick={clearVendorSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Vendor Suggestions Dropdown */}
                    {showVendorSuggestions && filteredVendors.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredVendors.map((vendor) => (
                          <div
                            key={vendor.id}
                            onClick={() => selectVendor(vendor)}
                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-medium text-slate-900">{vendor.name}</div>
                            {vendor.gst_number && (
                              <div className="text-sm text-slate-600">GST: {vendor.gst_number}</div>
                            )}
                            {vendor.address && (
                              <div className="text-xs text-slate-500 truncate">{vendor.address}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Start typing to see existing vendors or create a new one
                  </p>
                </div>

                {selectedVendor && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-900">Selected Vendor</div>
                        <div className="text-sm text-blue-700">{selectedVendor.name}</div>
                        {selectedVendor.gst_number && (
                          <div className="text-xs text-blue-600">GST: {selectedVendor.gst_number}</div>
                        )}
                      </div>
                      <Button
                        onClick={clearVendorSelection}
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Vendor GST Number
                  </Label>
                  <Input
                    value={vendorGST}
                    onChange={(e) => setVendorGST(e.target.value)}
                    placeholder="GSTIN number (if applicable)"
                    className="border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Vendor Address
                  </Label>
                  <Textarea
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="Complete vendor address"
                    rows={2}
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Items / Description *
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe goods or services provided"
                    rows={3}
                    className="border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">
                      Amount (₹) *
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-10 border-slate-300"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">
                      GST (₹)
                    </Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="number"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        placeholder="0.00"
                        className="pl-10 border-slate-300"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-white p-6 rounded-xl border border-emerald-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-emerald-800">
                      Subtotal:
                    </span>
                    <span className="text-xl font-bold">
                      ₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-700">
                      GST:
                    </span>
                    <span className="text-slate-800">
                      ₹{Number(gst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-emerald-300">
                    <span className="text-2xl font-bold text-emerald-900">
                      TOTAL AMOUNT:
                    </span>
                    <span className="text-3xl font-bold text-emerald-900">
                      ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700 font-medium mb-2 block">
                    Upload Supporting Document (PDF/Image)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={generatePDF}
                  disabled={pdfLoading || !vendorName || !amount || !invoiceDate}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {pdfLoading ? "Generating PDF..." : "Download Invoice"}
                </Button>

                <Button
                  variant="outline"
                  onClick={uploadToDrive}
                  disabled={loading || !file}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {loading ? "Uploading..." : "Upload to Drive"}
                </Button>
              </div>

              {driveUrl && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <ExternalLink className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-800">Document Uploaded!</p>
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all block mt-1"
                      >
                        {driveUrl}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={saveToDatabase}
                disabled={!driveUrl || !vendorName || !amount || !invoiceDate}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 text-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Invoice to Database
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Invoice Preview */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b">
              <CardTitle className="flex items-center gap-3 text-emerald-900">
                <Eye className="w-6 h-6" />
                Invoice Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Invoice Preview */}
              <div className="bg-white border-2 border-slate-300 rounded-xl shadow-inner overflow-hidden">
                {/* Invoice Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center">
                  <div className="text-white text-3xl font-bold mb-2">TAX INVOICE</div>
                  <div className="text-slate-300 text-sm">Original for Recipient</div>
                </div>
                
                {/* Company Header with Logo */}
                <div className="p-6 bg-gradient-to-r from-slate-100 to-white border-b border-slate-200">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-20 h-20 mr-4">
                      <Image
                        src="/logo.png"
                        alt="Mountain Pass Resort Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{COMPANY_INFO.name}</div>
                      <div className="text-slate-600">RESORT & SPA</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">Address:</div>
                      <div className="text-slate-800">{COMPANY_INFO.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500">Contact:</div>
                      <div className="text-slate-800">{COMPANY_INFO.phone}</div>
                      <div className="text-slate-800">{COMPANY_INFO.email}</div>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Details */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Bill From:</div>
                      <div className="font-semibold text-slate-900">{COMPANY_INFO.name}</div>
                      <div className="text-sm text-slate-700">{COMPANY_INFO.address}</div>
                      <div className="text-sm text-slate-700">GSTIN: {COMPANY_INFO.gstin}</div>
                      <div className="text-sm text-slate-700">PAN: {COMPANY_INFO.pan}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Bill To:</div>
                      <div className="font-semibold text-slate-900">{vendorName || "Vendor Name"}</div>
                      {vendorGST && (
                        <div className="text-sm text-slate-700">GST: {vendorGST}</div>
                      )}
                      {vendorAddress && (
                        <div className="text-sm text-slate-700">{vendorAddress}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Invoice Info Table */}
                  <div className="mb-6">
                    <div className="bg-slate-100 p-3 rounded-t-lg">
                      <div className="font-semibold text-slate-800">Invoice Details</div>
                    </div>
                    <div className="border border-slate-200 border-t-0 rounded-b-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500">Invoice No:</div>
                          <div className="font-mono font-semibold">{billNumber}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Invoice Date:</div>
                          <div className="font-semibold">
                            {new Date(invoiceDate).toLocaleDateString("en-IN", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Due Date:</div>
                          <div className="font-semibold">
                            {new Date(getDueDate()).toLocaleDateString("en-IN", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Reference:</div>
                          <div className="truncate">{description?.substring(0, 30) || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Items Table */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-3 rounded-t-lg">
                      <div className="flex justify-between font-semibold">
                        <span>Description</span>
                        <span>Amount (₹)</span>
                      </div>
                    </div>
                    <div className="border border-slate-200 border-t-0 rounded-b-lg">
                      <div className="p-4 border-b border-slate-100">
                        <div className="flex justify-between">
                          <span>{description || "Goods/Services"}</span>
                          <span className="font-semibold">₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      
                      {/* Amount Calculation */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between text-slate-700">
                          <span>Subtotal:</span>
                          <span>₹{Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>GST:</span>
                          <span>₹{Number(gst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="border-t border-slate-300 pt-3 mt-3">
                          <div className="flex justify-between text-xl font-bold text-slate-900">
                            <span>TOTAL AMOUNT:</span>
                            <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="font-semibold">Bank Details:</div>
                    <div>{COMPANY_INFO.bankName} | A/C No: {COMPANY_INFO.accountNo} | IFSC: {COMPANY_INFO.ifsc}</div>
                    <div className="pt-2">Terms: Payment due within 15 days. Late payments may attract interest charges.</div>
                    <div className="pt-4 text-center italic">This is a computer-generated invoice. No signature required.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}