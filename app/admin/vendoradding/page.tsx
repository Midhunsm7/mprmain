"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Building2, 
  Phone, 
  Mail, 
  FileText, 
  MapPin, 
  CreditCard, 
  DollarSign,
  Plus,
  Loader2,
  Search,
  ShieldAlert,
  Banknote,
  QrCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VendorAddingPage() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [existingVendors, setExistingVendors] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    gst_number: string;
    ifsc_code?: string;
    upi_id?: string;
    account_number?: string;
  }>>([]);

  const [form, setForm] = useState({
    // Basic Info
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
    
    // Financial Info
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    outstanding_amount: "",
  });

  const basicFields = [
    {
      key: "name" as const,
      label: "Company Name",
      placeholder: "Vendor / Company Name",
      required: true,
      icon: Building2,
      validation: (value: string) => value.trim().length > 0
    },
    {
      key: "phone" as const,
      label: "Phone Number",
      placeholder: "+91 98765 43210",
      icon: Phone,
      validation: (value: string) => !value || /^[\d\s+\-()]+$/.test(value)
    },
    {
      key: "email" as const,
      label: "Email Address",
      placeholder: "vendor@example.com",
      type: "email",
      icon: Mail,
      validation: (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    {
      key: "gst_number" as const,
      label: "GSTIN Number",
      placeholder: "27ABCDE1234F1Z5",
      icon: FileText,
      validation: (value: string) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.toUpperCase())
    },
    {
      key: "address" as const,
      label: "Business Address",
      placeholder: "Street, City, State, PIN",
      icon: MapPin,
      validation: () => true
    },
  ];

  const financialFields = [
    {
      key: "account_number" as const,
      label: "Bank Account Number",
      placeholder: "XXXX XXXX XXXX XXXX",
      icon: CreditCard,
      validation: (value: string) => !value || /^[\d\s]+$/.test(value),
      info: "For direct bank transfers"
    },
    {
      key: "ifsc_code" as const,
      label: "IFSC Code",
      placeholder: "SBIN0000123",
      icon: Banknote,
      validation: (value: string) => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase()),
      info: "Bank's IFSC code for transfers"
    },
    {
      key: "upi_id" as const,
      label: "UPI ID",
      placeholder: "vendor@upi",
      icon: QrCode,
      validation: (value: string) => !value || /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z._]{2,49}$/.test(value),
      info: "For quick UPI payments"
    },
    {
      key: "outstanding_amount" as const,
      label: "Opening Balance (₹)",
      placeholder: "0.00",
      type: "number",
      icon: DollarSign,
      validation: (value: string) => !value || /^\d+(\.\d{1,2})?$/.test(value)
    },
  ];

  // Safe search function
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return existingVendors;
    
    const query = searchQuery.toLowerCase().trim();
    
    return existingVendors.filter(vendor => {
      // Safely handle vendor properties
      const name = vendor?.name?.toLowerCase?.() || '';
      const email = vendor?.email?.toLowerCase?.() || '';
      const phone = vendor?.phone?.toLowerCase?.() || '';
      const gst = vendor?.gst_number?.toLowerCase?.() || '';
      
      return name.includes(query) || 
             email.includes(query) || 
             phone.includes(query) || 
             gst.includes(query);
    });
  }, [existingVendors, searchQuery]);

  function updateField(field: keyof typeof form, value: string) {
    setForm(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  }

  function validateForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate basic fields
    basicFields.forEach(field => {
      const value = form[field.key];
      if (field.required && !value.trim()) {
        errors.push(`${field.label} is required`);
      } else if (!field.validation(value)) {
        errors.push(`${field.label} is invalid`);
      }
    });

    // Validate financial fields
    financialFields.forEach(field => {
      const value = form[field.key];
      if (!field.validation(value)) {
        errors.push(`${field.label} is invalid`);
      }
    });

    // Additional validation: IFSC code requires account number
    if (form.ifsc_code && !form.account_number) {
      errors.push("Account number is required when providing IFSC code");
    }

    // Additional validation: UPI ID format
    if (form.upi_id && !form.upi_id.includes('@')) {
      errors.push("UPI ID must contain '@' symbol (e.g., vendor@upi)");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    
    const validation = validateForm();
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/vendors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Basic Information
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          gst_number: form.gst_number.toUpperCase().trim() || null,
          address: form.address.trim() || null,
          
          // Financial Information (NEW FIELDS)
          account_number: form.account_number.trim() || null,
          ifsc_code: form.ifsc_code.trim().toUpperCase() || null, // NEW FIELD
          upi_id: form.upi_id.trim() || null, // NEW FIELD
          outstanding_amount: form.outstanding_amount
            ? parseFloat(form.outstanding_amount)
            : 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add vendor");
      }

      toast.success("🎉 Vendor added successfully", {
        description: `${form.name} has been registered with complete financial details.`,
      });

      // Add to existing vendors list
      setExistingVendors(prev => [...prev, {
        id: result.id || Date.now().toString(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        gst_number: form.gst_number,
        ifsc_code: form.ifsc_code,
        upi_id: form.upi_id,
        account_number: form.account_number,
      }]);

      // Reset form
      setForm({
        name: "",
        phone: "",
        email: "",
        gst_number: "",
        address: "",
        account_number: "",
        ifsc_code: "",
        upi_id: "",
        outstanding_amount: "",
      });

      // Reset to basic tab
      setActiveTab("basic");
      
    } catch (err: any) {
      console.error("Vendor creation error:", err);
      toast.error("Failed to add vendor", {
        description: err.message || "Please check the details and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Function to handle search input safely
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || "";
    setSearchQuery(value);
  }

  // Function to handle search keydown safely
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      // Safe search execution
      const query = searchQuery?.toLowerCase?.() || "";
      console.log("Searching for:", query);
    }
  }

  // Function to render field with validation
  function renderField(field: typeof basicFields[0] | typeof financialFields[0], isFinancial = false) {
    const Icon = field.icon;
    const value = form[field.key];
    const isValid = field.validation(value);
    
    return (
      <div 
        key={field.key}
        className={field.key === "address" ? "col-span-full" : ""}
      >
        <Label 
          htmlFor={field.key}
          className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
        >
          <Icon className="w-4 h-4" />
          {field.label}
          {field.required && (
            <span className="text-red-500">*</span>
          )}
        </Label>
        <div className="relative">
          <Input
            id={field.key}
            type={field.type || "text"}
            placeholder={field.placeholder}
            value={value}
            onChange={e => updateField(field.key, e.target.value)}
            className={`pl-10 h-11 transition-all ${
              value && !isValid
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            required={field.required}
          />
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            value && !isValid ? "text-red-400" : "text-gray-400"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          {value && !isValid && (
            <ShieldAlert className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>
        {value && !isValid && (
          <p className="text-red-500 text-xs mt-1">
            Please enter a valid {field.label.toLowerCase()}
          </p>
        )}
        {"info" in field && field.info && (
          <p className="text-gray-500 text-xs mt-1">
            {field.info}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-2">
                Add new vendors with complete financial details
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              New: IFSC & UPI Support
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Existing Vendors */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Section */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Search Vendors
                </CardTitle>
                <CardDescription>
                  Find existing vendors by name, GSTIN, or bank details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 h-11"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    Total: {existingVendors.length}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    With UPI: {existingVendors.filter(v => v.upi_id).length}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    With Bank: {existingVendors.filter(v => v.account_number).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Existing Vendors List */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Vendor Directory</span>
                  <Badge variant="secondary">
                    {filteredVendors.length} shown
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map(vendor => (
                      <div
                        key={vendor.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {vendor.name || "Unnamed Vendor"}
                            </p>
                            {vendor.email && (
                              <p className="text-sm text-gray-600 mt-1">
                                📧 {vendor.email}
                              </p>
                            )}
                            {vendor.phone && (
                              <p className="text-sm text-gray-600">
                                📞 {vendor.phone}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {vendor.gst_number && (
                              <Badge variant="outline" className="text-xs">
                                GST
                              </Badge>
                            )}
                            {vendor.upi_id && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                                UPI
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Financial Details */}
                        {(vendor.account_number || vendor.upi_id) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {vendor.account_number && (
                                <div>
                                  <span className="text-gray-500">Acct:</span>
                                  <span className="ml-1 font-medium">
                                    •••• {vendor.account_number.slice(-4)}
                                  </span>
                                </div>
                              )}
                              {vendor.ifsc_code && (
                                <div>
                                  <span className="text-gray-500">IFSC:</span>
                                  <span className="ml-1 font-medium">
                                    {vendor.ifsc_code}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        {searchQuery ? "No vendors found" : "No vendors added yet"}
                      </p>
                      {searchQuery && (
                        <p className="text-sm text-gray-400 mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Add New Vendor Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl overflow-hidden h-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        Add New Vendor
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Complete vendor profile with financial information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </div>

              <CardContent className="p-6 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="basic">
                      <Building2 className="w-4 h-4 mr-2" />
                      Basic Information
                    </TabsTrigger>
                    <TabsTrigger value="financial">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Financial Details
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Tab */}
                    <TabsContent value="basic" className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-blue-900">
                              Company Details
                            </h3>
                            <p className="text-sm text-blue-700">
                              Fill in basic vendor information
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {basicFields.map(field => renderField(field))}
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          type="button"
                          onClick={() => setActiveTab("financial")}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        >
                          Continue to Financial Details
                          <CreditCard className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Financial Details Tab */}
                    <TabsContent value="financial" className="space-y-6">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-green-900">
                              Payment Information
                            </h3>
                            <p className="text-sm text-green-700">
                              Add banking and payment details for faster transactions
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {financialFields.map(field => renderField(field, true))}
                      </div>

                      {/* Payment Methods Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className={`p-4 rounded-lg border ${
                          form.upi_id 
                            ? "bg-green-50 border-green-200" 
                            : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              form.upi_id ? "bg-green-100" : "bg-gray-100"
                            }`}>
                              <QrCode className={`w-5 h-5 ${
                                form.upi_id ? "text-green-600" : "text-gray-400"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">UPI Payments</p>
                              <p className="text-sm text-gray-600">
                                {form.upi_id ? "Configured" : "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${
                          form.account_number 
                            ? "bg-blue-50 border-blue-200" 
                            : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              form.account_number ? "bg-blue-100" : "bg-gray-100"
                            }`}>
                              <Banknote className={`w-5 h-5 ${
                                form.account_number ? "text-blue-600" : "text-gray-400"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Bank Transfers</p>
                              <p className="text-sm text-gray-600">
                                {form.account_number ? "Configured" : "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg border ${
                          parseFloat(form.outstanding_amount || "0") > 0
                            ? "bg-amber-50 border-amber-200" 
                            : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              parseFloat(form.outstanding_amount || "0") > 0 
                                ? "bg-amber-100" 
                                : "bg-gray-100"
                            }`}>
                              <DollarSign className={`w-5 h-5 ${
                                parseFloat(form.outstanding_amount || "0") > 0 
                                  ? "text-amber-600" 
                                  : "text-gray-400"
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">Opening Balance</p>
                              <p className="text-sm text-gray-600">
                                ₹{parseFloat(form.outstanding_amount || "0").toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("basic")}
                        >
                          ← Back to Basic Info
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Saving Vendor...
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5 mr-2" />
                              Save Vendor with Financial Details
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </form>

                  {/* Form Validation Summary */}
                  {validateForm().errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        <p className="font-medium text-red-900">
                          Please fix the following errors:
                        </p>
                      </div>
                      <ul className="list-disc list-inside mt-2 text-red-700 text-sm">
                        {validateForm().errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {validateForm().errors.length > 3 && (
                          <li className="text-gray-600">
                            ...and {validateForm().errors.length - 3} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </Tabs>

                {/* Quick Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setForm({
                          name: "",
                          phone: "",
                          email: "",
                          gst_number: "",
                          address: "",
                          account_number: "",
                          ifsc_code: "",
                          upi_id: "",
                          outstanding_amount: "",
                        });
                        setActiveTab("basic");
                      }}
                      disabled={loading}
                    >
                      Clear All Fields
                    </Button>
                    
                    <div className="flex-1 text-sm text-gray-500">
                      <p className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        All information is securely stored and encrypted
                      </p>
                      <p className="mt-1">
                        Financial details help in faster vendor payments
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}