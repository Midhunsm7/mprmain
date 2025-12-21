"use client";

import { useState, useEffect } from "react";
import React from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  FileText, 
  Calendar,
  Save,
  Edit2,
  X,
  Upload,
  Camera,
  Shield,
  Award,
  DollarSign,
  Briefcase,
  FileCheck,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add type definition for params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StaffDetail({ params }: PageProps) {
  // ✅ FIXED: Unwrap the params promise using React.use()
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    console.log("Loading staff data for ID:", id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/get?id=${id}&t=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      console.log("Received staff data:", data);
      setStaff(data);
    } catch (error: any) {
      console.error("Error loading staff:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  async function update(field: string, value: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      
      if (!res.ok) {
        throw new Error("Update failed");
      }
      
      // Optimistic update
      setStaff((prev: any) => ({ ...prev, [field]: value }));
      
      // Force a re-fetch to ensure consistency with server
      setTimeout(() => {
        load();
      }, 100);
    } catch (error) {
      console.error("Update failed:", error);
      // Revert optimistic update if failed
      load();
    } finally {
      setSaving(false);
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("staffId", id);
    formData.append("field", field);

    try {
      const res = await fetch("/api/staff/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        // Optimistic update
        setStaff((prev: any) => ({ ...prev, [field]: data.url }));
        await update(field, data.url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      load(); // Revert on error
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Error Loading Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error}</p>
            <div className="flex gap-3">
              <Button onClick={load} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading staff details...</p>
          <p className="text-sm text-slate-400">ID: {id}</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Staff Not Found</h3>
            <p className="text-slate-500 mb-4">Staff member with ID {id} was not found.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Staff Management</h1>
              <p className="text-slate-600 mt-2">Employee profile and details management</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStaff(null);
                  load();
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Force Refresh
              </Button>
              <Button
                onClick={load}
                variant="outline"
                className="border-slate-300"
                disabled={loading || saving}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
        </div>

        {saving && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Saving changes...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <AvatarImage src={staff.profile_picture} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-white text-2xl font-bold">
                        {getInitials(staff.name || "NA")}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload("profile_picture", e.target.files[0])}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Staff Info */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{staff.name || "No Name"}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {staff.department || "Not assigned"}
                      </Badge>
                      <Badge className={
                        staff.status === "active" 
                          ? "bg-green-100 text-green-800 border-green-200"
                          : staff.status === "inactive"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-yellow-100 text-yellow-800 border-yellow-200"
                      }>
                        {staff.status || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Employee ID</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {staff.employee_id || "EMP-" + id.substring(0, 6)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500">Joined</div>
                      <div className="font-semibold text-slate-900">
                        {formatDate(staff.joined_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{staff.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{staff.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700">{staff.address || "No address"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Staff Information</CardTitle>
              </CardHeader>
              
              <CardContent>
                {/* ✅ FIXED: Tabs moved inside CardContent, all TabsContent as direct children */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="employment" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Employment
                    </TabsTrigger>
                    <TabsTrigger value="hr" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      HR & Policy
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Full Name"
                        value={staff.name}
                        icon={User}
                        onSave={(v: string) => update("name", v)}
                        required
                        saving={saving}
                      />
                      <EditableField
                        label="Email Address"
                        value={staff.email}
                        icon={Mail}
                        onSave={(v: string) => update("email", v)}
                        type="email"
                        saving={saving}
                      />
                      <EditableField
                        label="Phone Number"
                        value={staff.phone}
                        icon={Phone}
                        onSave={(v: string) => update("phone", v)}
                        type="tel"
                        saving={saving}
                      />
                      <EditableField
                        label="Aadhaar Number"
                        value={staff.aadhaar}
                        icon={CreditCard}
                        onSave={(v: string) => update("aadhaar", v)}
                        placeholder="Enter 12-digit Aadhaar"
                        saving={saving}
                      />
                    </div>
                    
                    <EditableTextarea
                      label="Address"
                      value={staff.address}
                      icon={MapPin}
                      onSave={(v: string) => update("address", v)}
                      rows={3}
                      saving={saving}
                    />
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FileUploadField
                        label="Aadhaar Card"
                        value={staff.aadhaar_url}
                        onUpload={(file: File) => handleFileUpload("aadhaar_url", file)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        uploading={uploading}
                      />
                      <FileUploadField
                        label="PAN Card"
                        value={staff.pan_url}
                        onUpload={(file: File) => handleFileUpload("pan_url", file)}
                        accept=".pdf,.jpg,.jpeg,.png"
                        uploading={uploading}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Other Documents</h3>
                      <div className="space-y-4">
                        {staff.documents && staff.documents.length > 0 ? (
                          staff.documents.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <div>
                                <div className="font-medium text-slate-900">{doc.name}</div>
                                <div className="text-sm text-slate-500">{doc.type}</div>
                              </div>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FileCheck className="w-5 h-5" />
                              </a>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-center py-8">No additional documents uploaded</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="employment" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Department"
                        value={staff.department}
                        icon={Building}
                        onSave={(v: string) => update("department", v)}
                        saving={saving}
                      />
                      <EditableField
                        label="Designation"
                        value={staff.designation}
                        icon={Award}
                        onSave={(v: string) => update("designation", v)}
                        saving={saving}
                      />
                      <EditableField
                        label="Salary"
                        value={staff.salary}
                        icon={DollarSign}
                        onSave={(v: string) => update("salary", v)}
                        type="number"
                        prefix="₹"
                        saving={saving}
                      />
                      <EditableField
                        label="Joining Date"
                        value={staff.joined_at?.split('T')[0]}
                        icon={Calendar}
                        onSave={(v: string) => update("joined_at", v)}
                        type="date"
                        saving={saving}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField
                        label="Employee ID"
                        value={staff.employee_id}
                        icon={User}
                        onSave={(v: string) => update("employee_id", v)}
                        placeholder="EMP-XXXXXX"
                        saving={saving}
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Employment Status
                        </label>
                        <select
                          value={staff.status || "active"}
                          onChange={(e) => update("status", e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={saving}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="probation">Probation</option>
                          <option value="notice_period">Notice Period</option>
                        </select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hr" className="space-y-6">
                    <EditableTextarea
                      label="HR Policy Agreement"
                      value={staff.hr_policy}
                      icon={Shield}
                      onSave={(v: string) => update("hr_policy", v)}
                      rows={8}
                      placeholder="Enter HR policy details, terms, and conditions..."
                      saving={saving}
                    />
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Policy Information</h4>
                      <p className="text-sm text-blue-700">
                        This section contains the HR policy agreement details for the employee.
                        Make sure all terms and conditions are clearly stated and agreed upon.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableField({ 
  label, 
  value, 
  icon: Icon, 
  onSave, 
  type = "text",
  placeholder = "",
  required = false,
  prefix = "",
  saving = false
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="relative">
            {prefix && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                {prefix}
              </span>
            )}
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className={prefix ? "pl-8" : ""}
              placeholder={placeholder}
              disabled={saving}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="border-slate-300"
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="text-slate-900">
            {prefix && <span className="mr-1">{prefix}</span>}
            {value || <span className="text-slate-400 italic">{placeholder || "Not set"}</span>}
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
            disabled={saving}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ 
  label, 
  value, 
  icon: Icon, 
  onSave, 
  rows = 4,
  placeholder = "",
  saving = false
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value || "");

  useEffect(() => {
    setTempValue(value || "");
  }, [value]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className="min-h-[150px]"
            disabled={saving}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={handleCancel}
              size="sm"
              variant="outline"
              className="border-slate-300"
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[150px] whitespace-pre-wrap hover:border-slate-300 transition-colors">
            {value || <span className="text-slate-400 italic">{placeholder || "No content"}</span>}
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={saving}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function FileUploadField({ label, value, onUpload, accept, uploading }: any) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className={`border-2 ${value ? 'border-green-200' : 'border-slate-300'} border-dashed rounded-lg p-6 text-center transition-all duration-300 hover:border-blue-400`}>
        {value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <FileCheck className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-slate-900">Document Uploaded</div>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  View Document
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm text-slate-600 mb-2">No file uploaded</p>
              <p className="text-xs text-slate-500">Upload {label.toLowerCase()}</p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <label className={`inline-flex items-center gap-2 px-4 py-2 ${uploading ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200'} text-slate-700 rounded-lg cursor-pointer transition-colors`}>
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {value ? "Replace File" : "Upload File"}
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          {fileName && !uploading && (
            <p className="text-xs text-slate-500 mt-2 truncate max-w-xs mx-auto">{fileName}</p>
          )}
        </div>
      </div>
    </div>
  );
}