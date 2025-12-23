"use client";

import { useState } from "react";
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
  Loader2
} from "lucide-react";

export default function VendorAddingPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
    account_number: "",
    outstanding_amount: "",
  });

  const formFields = [
    {
      key: "name" as const,
      label: "Company Name",
      placeholder: "Vendor / Company Name",
      required: true,
      icon: Building2,
    },
    {
      key: "phone" as const,
      label: "Phone Number",
      placeholder: "+91 98765 43210",
      icon: Phone,
    },
    {
      key: "email" as const,
      label: "Email Address",
      placeholder: "vendor@example.com",
      type: "email",
      icon: Mail,
    },
    {
      key: "gst_number" as const,
      label: "GSTIN Number",
      placeholder: "27ABCDE1234F1Z5",
      icon: FileText,
    },
    {
      key: "address" as const,
      label: "Business Address",
      placeholder: "Street, City, State, PIN",
      icon: MapPin,
    },
    {
      key: "account_number" as const,
      label: "Bank Account",
      placeholder: "XXXX XXXX XXXX XXXX",
      icon: CreditCard,
    },
    {
      key: "outstanding_amount" as const,
      label: "Outstanding Balance",
      placeholder: "0.00",
      type: "number",
      icon: DollarSign,
    },
  ];

  function updateField(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    
    if (!form.name.trim()) {
      toast.error("Company name is required");
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
          name: form.name,
          phone: form.phone || null,
          email: form.email || null,
          gst_number: form.gst_number || null,
          address: form.address || null,
          account_number: form.account_number || null,
          outstanding_amount: form.outstanding_amount
            ? Number(form.outstanding_amount)
            : 0,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to add vendor");
      }

      toast.success("🎉 Vendor added successfully", {
        description: `${form.name} has been registered in the system.`,
      });

      // Reset form
      setForm({
        name: "",
        phone: "",
        email: "",
        gst_number: "",
        address: "",
        account_number: "",
        outstanding_amount: "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add vendor", {
        description: err.message || "Please check the details and try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Add New Vendor
          </h1>
          <p className="text-gray-600 mt-2">
            Register a new vendor to your business network. Fill in the details below.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    Vendor Information
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Enter the vendor details carefully
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <div 
                      key={field.key}
                      className={field.key === "name" || field.key === "address" ? "md:col-span-2" : ""}
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
                          value={form[field.key]}
                          onChange={e => updateField(field.key, e.target.value)}
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                          required={field.required}
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Outstanding Amount Highlight */}
              {form.outstanding_amount && parseFloat(form.outstanding_amount) > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">
                          Outstanding Balance
                        </p>
                        <p className="text-sm text-amber-700">
                          Vendor has an outstanding amount
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-900">
                      ₹{parseFloat(form.outstanding_amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Vendor
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setForm({
                    name: "",
                    phone: "",
                    email: "",
                    gst_number: "",
                    address: "",
                    account_number: "",
                    outstanding_amount: "",
                  })}
                  disabled={loading}
                >
                  Clear All
                </Button>
              </div>

              {/* Form Tips */}
              <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                <p className="flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Required fields
                </p>
                <p className="mt-1">
                  All information will be securely stored and can be updated later.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats/Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Coming Soon</p>
                </div>
                <Building2 className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active GST</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">Coming Soon</p>
                </div>
                <FileText className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₹0</p>
                </div>
                <DollarSign className="w-10 h-10 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}